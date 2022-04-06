const { v4: uuidv4 } = require("uuid");
class DemoService extends cds.ApplicationService {
  async init() {
    const bupa = await cds.connect.to("OP_API_BUSINESS_PARTNER_SRV");
    /**
     * external service(s)
     */
    const { A_BusinessPartner } = bupa.entities;
    /**
     * local service(s)
     */
    const { BusinessPartner } = this.entities;

    this.on("READ", BusinessPartner, async (req) => {
      this.oCurrentRequest = req.query.SELECT;
      let oQuery;
      const aColumns = [];
      this._createColumns(aColumns);

      switch (true) {
        case (this.oCurrentRequest.where !== undefined):
          const aWhereClause = this._buildWhereClause(this.oCurrentRequest.where, req);
          const oWhereClause = (aWhereClause.length === 1) ? aWhereClause[0] : null; // if aWhereClause.length > 0
          oQuery = this._buildQuery(A_BusinessPartner, aColumns, oWhereClause);
          break;
        case (this.oCurrentRequest.from.ref[0].where !== undefined):
          const sUUID = this._getSelectedBusinessPartnerByUUID();
          const oBP = await SELECT.from(BusinessPartner).columns("BusinessPartner").where({ID: sUUID});
          oQuery = this._buildQuery(A_BusinessPartner, aColumns, oBP[0]);
          break;
        default:
          oQuery = this._buildQuery(A_BusinessPartner, aColumns, null);
      }

      const aBusinessPartner = await bupa.tx(req).run(oQuery);

      /**
       * map - key value pairs
       * save Business Partner Id as key and Business Partner object as value 
       */
      const mBusinessPartnerMapping = new Map();

      /**
       * array with ID's of selected Business Partners (line 89)
       * map through selected Business Partners
       */
      const aBusinessPartnerIDs = aBusinessPartner.map((oBusinessPartner) => oBusinessPartner.BusinessPartner);  // implicit return
      // identification = UUID + Business Partner ID
      const aBusinessPartnerIdentification = await cds.run(
        SELECT.from(BusinessPartner) // local entity -> defined in schema.cds
          .columns("ID", "BusinessPartner")
          .where({ BusinessPartner: aBusinessPartnerIDs })
      );

      /**
       * block to make sure that uuid and business partner id exist for every business partner
       */
      const aInsertPromises = aBusinessPartnerIDs.map((sBusinessPartnerID) => { // '1000030'
        const oUUID = aBusinessPartnerIdentification.find(
          (oBusinessPartnerUUID) =>
            oBusinessPartnerUUID.BusinessPartner === sBusinessPartnerID
        );
        if (!oUUID) {
          const sUUID = uuidv4(); // generate UUID
          return cds.run(
            INSERT.into(BusinessPartner).entries({
              ID: sUUID,
              BusinessPartner: sBusinessPartnerID,
            })
          );
        }
      });
      await Promise.all(aInsertPromises);

      /**
       * select from then entity (BusinessPartner) stored in the database
       */
      const aData = await cds.run(
        SELECT.from(this.oCurrentRequest.from).where({
          BusinessPartner: aBusinessPartnerIDs,
        })
      );

      aData.forEach((oData) => {
        mBusinessPartnerMapping.set(oData.BusinessPartner, oData);
      });

      const aResult = aBusinessPartner.map((oData) => {
        const oRecord = mBusinessPartnerMapping.get(oData.BusinessPartner);
        if (!oRecord) {
            return;
        }

        oRecord.FirstName = oData.FirstName;
        oRecord.LastName = oData.LastName;
        oRecord.BusinessPartnerIsBlocked = oData.BusinessPartnerIsBlocked;
        if (this.isColumnRequest("CityName"))
          oRecord.CityName = oData.to_BusinessPartnerAddress[0]?.CityName || "";
        if (this.isColumnRequest("StreetName"))
          oRecord.StreetName =
            oData.to_BusinessPartnerAddress[0]?.StreetName || "";
        if (this.isColumnRequest("Region"))
          oRecord.Region = oData.to_BusinessPartnerAddress[0]?.Region || "";
        if (this.isColumnRequest("Country"))
          oRecord.Country = oData.to_BusinessPartnerAddress[0]?.Country || "";

        return oRecord;
      });
      // Count data if requested
      if (req.query.SELECT.count) {
        aResult["$count"] = aResult.length;
      }
      return aResult;
    });
    await super.init();
  }

  _createColumns(aColumns) {
    aColumns.push({ ref: "BusinessPartner" }); // key field
    aColumns.push({ ref: "FirstName" });
    aColumns.push({ ref: "LastName" });
    aColumns.push({ ref: "BusinessPartnerIsBlocked" });
    const oAddress = {
      ref: ["to_BusinessPartnerAddress"],
      expand: [
        { ref: "CityName" },
        { ref: "StreetName" },
        { ref: "Region" },
        { ref: "Country" },
      ],
    };
    aColumns.push(oAddress);
  }

  isColumnRequest(sColName) {
    if (!this.oCurrentRequest.columns) {
      return true;
    }
    if (
      this.oCurrentRequest.columns.some(
        (oColumn) =>
          oColumn === sColName ||
          oColumn.ref === sColName ||
          oColumn.ref[0] === sColName
      )
    ) {
      return true;
    }
    return false;
  }

  _buildQuery(oEntity, aColumns, aWhereClause) {
    if (oEntity) {
      if (Array.isArray(aColumns) && aColumns.length > 0) {
        let oQuery = SELECT.from(oEntity).columns(aColumns);
        if (aWhereClause) {
          oQuery = oQuery.where(aWhereClause);
        }
        return oQuery;
      }
    } else {
      return;
    }
  }

  /**
   * customize where clauses because default where clauses include draft based expressions
   * in the entity of the remote service there are no draft based fields!
   * @param {Object} req 
   * @returns Array of where clauses
   */
  _buildWhereClause(aReqWhereClause, req) {
    const aSelectionFields = req.target["@UI.SelectionFields"]; // any field you can access using the . operator, you can access using [] with a string version of the field name.
    let aWhereClauses = [];
    for (let i = 0; i < aReqWhereClause.length; i++) {
      let oObj = aReqWhereClause[i];
      if (oObj.ref) {
        for (let j = 0; j < aSelectionFields.length; j++) {
          if (oObj.ref[0] === aSelectionFields[j]["="]) {
            i += 2;
            let oWhereClause = {};
            oWhereClause[oObj["ref"][0]] = aReqWhereClause[i].val; // get value for ref
            aWhereClauses.push(oWhereClause);
          }
        }
      }
    }
    return aWhereClauses;
  }

  _getSelectedBusinessPartnerByUUID() {
    for(let i = 0; this.oCurrentRequest.from.ref[0].where.length; i++) {
      if(this.oCurrentRequest.from.ref[0].where[i].ref[0] === 'ID') {
        return this.oCurrentRequest.from.ref[0].where[i+2].val;
      }
    }
  }
}

module.exports = { DemoService };


//   const oQuery2 = { ...req.query };
//   if (oQuery2.SELECT.from.ref[0].id) {
//     oQuery2.SELECT.from.ref[0].id = A_BusinessPartner.name;
//   } else {
//     oQuery2.SELECT.from.ref[0] = A_BusinessPartner.name;
//   }
//   const aDeleteColumns = [];
//   oQuery2.SELECT.columns?.forEach((oColumn, iIndex) => {
//     switch (oColumn.ref[0]) {
//       case "ID":
//       case "HasDraftEntity":
//       case "HasActiveEntity":
//       case "IsActiveEntity":
//       case "DraftAdministrativeData":
//         aDeleteColumns.push(iIndex);
//         break;
//       default:
//     }
//   });

//   aDeleteColumns.sort((a, b) => {
//     return b - a;
//   });
//   aDeleteColumns.forEach((iIndex) => {
//     oQuery2.SELECT.columns.splice(iIndex, 1);
//   });
