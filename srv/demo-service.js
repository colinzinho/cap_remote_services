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
        const { A_BusinessPartner } = bupa.entities;

        /**
         * local service(s)
         */
        const { BusinessPartner } = this.entities;

        this.on('READ', BusinessPartner, async(req) => {
            var aBusinessPartner = await bupa.run(SELECT(A_BusinessPartner, bp => {
                bp('BusinessPartner, FirstName, LastName, BusinessPartnerIsBlocked'),
                bp.to_BusinessPartnerAddress(address => {
                    address('CityName'), address('StreetName'), address('Region'), address('Country')
                })
            }))
            return aBusinessPartner;
        });

        // this.on('READ', BusinessPartner, async  (req) => {
        //     const aColumns = [];
        //     aColumns.push({ ref: "BusinessPartner" }); // key field
        //     aColumns.push({ ref: "FirstName" });
        //     aColumns.push({ ref: "LastName" });
        //     aColumns.push({ ref: "BusinessPartnerIsBlocked"})

        //     const oAddress = {
        //         ref: ["to_BusinessPartnerAddress"],
        //         expand: [
        //             { ref: "CityName" },
        //             { ref: "StreetName" },
        //             { ref: "Region" },
        //             { ref: "Country" }
        //         ]
        //     };
        //     aColumns.push(oAddress);

        //    console.log(aColumns); 

        //    const oQuery = SELECT.from(A_BusinessPartner)
        //         .columns(aColumns);
            
        //     const aBusinessPartner = await bupa.tx(req).run(oQuery);
            
        //     return aBusinessPartner;
        // });

        await super.init();
    }
}

module.exports = { DemoService };