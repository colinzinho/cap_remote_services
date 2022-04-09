var _ = require('underscore');
_.mixin(require('underscore.deepclone'));

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
      var oCurrentReqClone = _.deepClone(req.query);

      req.query.SELECT.from.ref = [];
      req.query.SELECT.from.ref.push('OP_API_BUSINESS_PARTNER_SRV.A_BusinessPartner')

      switch (true) {
        case (req.query.SELECT.columns !== undefined):
           this._deleteDraftColumns(req.query.SELECT.columns);
           this._addAssociation(req.query.SELECT.columns); // add association

        case (req.query.SELECT.orderBy !== undefined):
          if(req.query.SELECT.orderBy.length > 1) {
            const popped = req.query.SELECT.orderBy.pop();
            console.log(popped);
          }

        case (req.query.SELECT.where !== undefined):
           this._buildWhereClause(req);          
          break;
          
        case (req.query.SELECT.from.ref[0].where !== undefined):
          // const sUUID = this._getSelectedBusinessPartnerByUUID();
          // const oBP = await SELECT.from(BusinessPartner).columns("BusinessPartner").where({ID: sUUID});
          // oQuery = this._buildQuery(A_BusinessPartner, aColumns, oBP[0]);
          break;
        default:
      }

      const aBusinessPartner = await bupa.tx(req).run(req.query);

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
       * select from the entity (BusinessPartner) stored in the database
       */
      const aData = await cds.run(
        SELECT.from(oCurrentReqClone.SELECT.from).where({
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

  _deleteDraftColumns(aColumns) {
    const aDeleteColumns = [];
    aColumns.forEach((oColumn, iIndex) => {
      switch (oColumn.ref[0]) {
        case "CityName":
        case "StreetName":
        case "Region":
        case "Country":
        case "ID":
        case "IsActiveEntity":
        case "HasActiveEntity":
          aDeleteColumns.push(iIndex);
          break;
        default:
      }
    });
    aDeleteColumns.sort((a, b) => {
      return b - a;
    });
    aDeleteColumns.forEach((iIndex) => {
      aColumns.splice(iIndex, 1);
    })
  }

  _addAssociation(aColumns) {
    const oAddress = {
      ref: ["to_BusinessPartnerAddress"],
      expand: [
        { ref: "CityName" },
        { ref: "StreetName" },
        { ref: "Region" },
        { ref: "Country" }
      ]
    };
    aColumns.push(oAddress);
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
  _buildWhereClause(req) {
    const aSelectionFields = req.target["@UI.SelectionFields"]; // any field you can access using the . operator, you can access using [] with a string version of the field name.

    let aDeleteIndex = [];
    for(let i = 1; i < req.query.SELECT.where.length-1; i++) { // '(' and ')' will be left out
      if(req.query.SELECT.where[i]?.ref){
        let bMatches = aSelectionFields.includes(req.query.SELECT.where[i].ref[0]);
        if(!bMatches)
          aDeleteIndex.push(i, i+1, i+2);
        i += 2;
      }
      else
        aDeleteIndex.push(i);
    }

    aDeleteIndex.sort((a, b) => {
      return b - a;
    })
    aDeleteIndex.forEach((iIndex) => {
      req.query.SELECT.where.splice(iIndex, 1);
    })          

    if(req.query.SELECT.length > 3) {
      for(let i = 0; i < req.query.SELECT.where.length-1; i++) {
        // req.query.SELECT.where.push
      }
    }

    if(req.query.SELECT.where.length <= 2) {
      delete req.query.SELECT.where;
    }
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
