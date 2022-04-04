const { v4: uuidv4 } = require('uuid');
const _aWords = ['CityName', 'StreetName', 'Region', 'Country'];
class DemoService extends cds.ApplicationService {
    async init () {
        const bupa = await cds.connect.to("OP_API_BUSINESS_PARTNER_SRV");
        /**
         * external service(s)
         */
        const { A_BusinessPartner } = bupa.entities;
        /**
         * local service(s)
         */
        const { BusinessPartner } = this.entities;
        
        this.on('READ', BusinessPartner, async  (req) => {
            this.oCurrentRequest = req.query.SELECT;
            let oQuery;
            const aColumns = [];

            aColumns.push({ ref: "BusinessPartner" }); // key field
            aColumns.push({ ref: "FirstName" })
            aColumns.push({ ref: "LastName" })
            aColumns.push({ ref: "BusinessPartnerIsBlocked"})
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

            if(req.query.SELECT.where) {
                const aWhereClauses = this._buildWhereClauses(req);
                if(aWhereClauses.length === 1) {
                    oQuery = this._buildQuery(A_BusinessPartner, aColumns, aWhereClauses[0])
                } else {
                    oQuery = this._buildQuery(A_BusinessPartner, aColumns, null);
                }
            } else if(req.query.SELECT.search) {
                this._buildSearchClause(req);
            } else {
                oQuery = this._buildQuery(A_BusinessPartner, aColumns, null);
            }                     
            
            const aBusinessPartner = await bupa.tx(req).run(oQuery);

            const aData = aBusinessPartner.map((oData) => {
                oData.ID = uuidv4(); // add uuid for each data entry
                if(this.isColumnRequest("CityName"))
                    oData.CityName = oData.to_BusinessPartnerAddress[0]?.CityName || "";
                if(this.isColumnRequest("StreetName"))
                    oData.StreetName = oData.to_BusinessPartnerAddress[0]?.StreetName || "";
                if(this.isColumnRequest("Region"))
                    oData.Region = oData.to_BusinessPartnerAddress[0]?.Region || "";
                if(this.isColumnRequest("Country"))
                    oData.Country = oData.to_BusinessPartnerAddress[0]?.Country || ""; 

                delete oData.to_BusinessPartnerAddress;
                return oData;
            })
            // Count data if requested
            if (req.query.SELECT.count) {
                aData["$count"] = aData.length;
            }
            return aData;
        });
        await super.init();
    }

    isColumnRequest(sColName) {
        if(!this.oCurrentRequest.columns) {
            return true;
        }
        if(
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
        if(oEntity) {
            if(Array.isArray(aColumns) && aColumns.length > 0) {
                let oQuery = SELECT.from(oEntity).columns(aColumns);
                if(aWhereClause) {
                    oQuery = oQuery.where(aWhereClause);
                }
                return oQuery;
            }
        }else {
            return;
        }
    }
    
    _buildWhereClauses(req) {
        const aSelectionFields = req.target["@UI.SelectionFields"]; // any field you can access using the . operator, you can access using [] with a string version of the field name.
        let aWhereClauses = [];
        for(let i = 0; i < req.query.SELECT.where.length; i++) {
            let oObj = req.query.SELECT.where[i];
            if(oObj.ref) {
                for(let j = 0; j < aSelectionFields.length; j++) {
                    const oSelectionFields = aSelectionFields[j];
                    if(oObj.ref[0] === oSelectionFields["="]) {
                        i+=2; 
                        let oVal = req.query.SELECT.where[i]; // get value for ref
                        let oWhereClause = {};
                        oWhereClause[oObj["ref"][0]] = oVal.val;
                        aWhereClauses.push(oWhereClause);
                    }
                }
            }
        }
        return aWhereClauses;
    }

    _buildSearchClause(req) {
        if(Array.isArray(req.query.SELECT.columns)) {
            for(let i = 0; i < req.query.SELECT.columns.length; i++) {
                const oColumn = req.query.SELECT.columns[i];
                const bIncluded = _aWords.includes(oColumn.ref[0]);
                if(bIncluded) {
                    req.query.SELECT.columns.splice(i, 1);
                    i--;
                }
            }
        }
        oQuery = this._buildQuery(A_BusinessPartner, aColumns, {FirstName: req.query.SELECT.search[0].val})
    }
}
module.exports = { DemoService };
