// const cds = require('@sap/cds');

// module.exports = cds.service.impl(async function() {
//     const bupa = await cds.connect.to("OP_API_BUSINESS_PARTNER_SRV");

//     /**
//      * external service(s)
//      */
//      const { A_BusinessPartner } = bupa.entities;

//      /**
//       * local service(s)
//       */
//      const { BusinessPartner } = this.entities;

//      this.on('READ', BusinessPartner, async(req) => {
//         var aBusinessPartner = await bupa.run(SELECT(A_BusinessPartner, bp => {
//             bp('BusinessPartner, FirstName, LastName, BusinessPartnerIsBlocked'),
//             bp.to_BusinessPartnerAddress(address => {
//                 address('CityName'), address('StreetName'), address('Region'), address('Country')
//             })
//         }))
//         return aBusinessPartner;
//     });
// })
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

        // this.on('READ', BusinessPartner, async(req) => {
        //     this.oCurrentRequest = req.query.SELECT;

        //     var aBusinessPartner = await bupa.run(SELECT(A_BusinessPartner, bp => {
        //         bp('BusinessPartner, FirstName, LastName, BusinessPartnerIsBlocked')
        //         bp.to_BusinessPartnerAddress(address => {
        //             address('CityName'), address('StreetName'), address('Region'), address('Country')
        //         })
        //     }))

        //     const aData = aBusinessPartner.map((oData) => {
        //         if(this.isColumnRequest("CityName"))
        //             oData.CityName = oData.to_BusinessPartnerAddress[0]?.CityName || "";
        //         if(this.isColumnRequest("StreetName"))
        //             oData.StreetName = oData.to_BusinessPartnerAddress[0]?.StreetName || "";
        //         if(this.isColumnRequest("Region"))
        //             oData.Region = oData.to_BusinessPartnerAddress[0]?.Region || "";
        //         if(this.isColumnRequest("Country"))
        //             oData.Country = oData.to_BusinessPartnerAddress[0]?.Country || ""; 

        //         delete oData.to_BusinessPartnerAddress;
        //         return oData;
        //     })

        //     return aData;
            
        // });

        this.on('READ', BusinessPartner, async  (req) => {
            this.oCurrentRequest = req.query.SELECT;

            const aColumns = [];
            aColumns.push({ ref: "BusinessPartner" }); // key field

            aColumns.push({ ref: "FirstName" }) ||
            aColumns.push({ ref: "LastName" }) ||
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

           const oQuery = SELECT.from(A_BusinessPartner)
                .columns(aColumns);
            
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

        return false;
    }
}



module.exports = { DemoService };