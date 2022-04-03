class DemoService extends cds.ApplicationService {
    async init () {
        const bupa = await cds.connect.to("OP_API_BUSINESS_PARTNER_SRV");
        /**
         * external service(s)
         */
        const { A_BusinessPartner, A_BusinessPartnerAddress } = bupa.entities;
        /**
         * local service(s)
         */
        const { BusinessPartner } = this.entities;

        const _aWords = ['CityName', 'StreetName', 'Region', 'Country'];
        
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

            if(req.query.SELECT.search) {

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
                console.log(req.query.SELECT.columns);
            }

            

            oQuery = this._buildQuery(A_BusinessPartner, aColumns, null);
            
            const aBusinessPartner = await bupa.tx(req).run(oQuery);

            const aData = aBusinessPartner.map((oData) => {
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
            if(Array.isArray(aColumns) && aColumns.length < 0) {
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
}
module.exports = { DemoService };
