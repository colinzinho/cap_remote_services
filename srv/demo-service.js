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

      /**
       * Auch mit switch case möglich?
       * switch (req.query.SELECT) {
       *   case req.query.SELECT.where !== undefined:
       *        ...
       *    case ["search"]:
       *        ...
       *    default:
       *        ...
       *   }
       */
      if (req.query.SELECT.where) {
        const aWhereClauses = this._buildWhereClauses(req);
        // if aWhereClauses.length > 0
        if (aWhereClauses.length === 1) {
          oQuery = this._buildQuery(
            A_BusinessPartner,
            aColumns,
            aWhereClauses[0]
          );
        } else {
          oQuery = this._buildQuery(A_BusinessPartner, aColumns, null);
        }
      } else if (req.query.SELECT.search) {
        this._buildSearchClause(req);
      } else {
        oQuery = this._buildQuery(A_BusinessPartner, aColumns, null);
      }

    // !! commented code from faebu !!

      const aBusinessPartner = await bupa.tx(req).run(oQuery);

      /**
       * map - key value pairs
       * save Business Partner Id as key and Business Partner object as value 
       */
      const mBusinessPartnerMapping = new Map();

      /**
       * array with ID's of selected Business Partners (line 89)
       * map through selected Business Partners
       * aBusinessPartner.map(function (oBusinessPartner) {
       *    return oBusinessPartner.BusinessPartner
       * });
       */
      const aBusinessPartnerIDs = aBusinessPartner.map((oBusinessPartner) => oBusinessPartner.BusinessPartner);  // implicit return
      const aBusinessPartnerUUIDs = await cds.run(
        SELECT.from(BusinessPartner) // local entity -> defined in schema.cds
          .columns("ID", "BusinessPartner")
          .where({ BusinessPartner: aBusinessPartnerIDs })
      );

      /**
       * block to make sure that uuid and business partner id exist for every business partner - completed with first load
       */
      const aInsertPromises = aBusinessPartnerIDs.map((sBusinessPartnerID) => { // '1000030'
        const oUUID = aBusinessPartnerUUIDs.find(
          (oBusinessPartnerUUID) =>
            oBusinessPartnerUUID.BusinessPartner === sBusinessPartnerID
        );
        if (!oUUID) {
          const sUUID = uuidv4();

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
        SELECT.from(req.query.SELECT.from).where({
          BusinessPartner: aBusinessPartnerIDs,
        })
      );

      aData.forEach((oData) => {
        mBusinessPartnerMapping.set(oData.BusinessPartner, oData);
      });

      /**
       * enrich Business Partner data
       */
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

      if (req.query.SELECT.one) {
          return aResult.find(oResult => oResult !== undefined);
      }
      return aResult;
    });
    await super.init();
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

  _buildWhereClauses(req) {
    const aReqWhere = req.query.SELECT.where;
    const aSelectionFields = req.target["@UI.SelectionFields"]; // any field you can access using the . operator, you can access using [] with a string version of the field name.
    let aWhereClauses = [];
    for (let i = 0; i < aReqWhere.length; i++) {
      let oObj = aReqWhere[i];
      if (oObj.ref) {
        for (let j = 0; j < aSelectionFields.length; j++) {
          if (oObj.ref[0] === aSelectionFields[j]["="]) {
            i += 2;
            let oWhereClause = {};
            oWhereClause[oObj["ref"][0]] = aReqWhere[i].val; // get value for ref
            aWhereClauses.push(oWhereClause);
          }
        }
      }
    }
    return aWhereClauses;
  }

  _buildSearchClause(req) {
    // ...
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
