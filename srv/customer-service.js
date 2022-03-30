const cds = require('@sap/cds');
const { v4: uuidv4 } = require('uuid'); // https://www.npmjs.com/package/uuid

module.exports = cds.service.impl(async function() {

    /* connect to service defined/ declared in package.json
     * cds.connect.to returns a promise resolving to the OP_API_BUSINESS_PARTNER_SRV instance
     * we await the promise to be resolved for further processing 
    */
    const bupa = await cds.connect.to('OP_API_BUSINESS_PARTNER_SRV');
    // const { A_BusinessPartner, A_BusinessPartnerAddress } = bupa.entities;
    const { BusinessPartner, Customer } = this.entities;

    this.on('READ', 'Customer', async() => {
        var elements = Customer.elements;
        const results = await bupa.run(SELECT(BusinessPartner, bp => {
            bp('*'),
            bp.to_BusinessPartnerAddress(address => {
                address('AddressID'), address('BusinessPartner'), address('CityName'), address('StreetName'), address('PostalCode'), address('Region'), address('Country')
            })
        }));

        if(!Array.isArray(elements)) {
            elements = [elements];
        }

        for(var i = 0; i < results.length; i++) {
            var record  = results[i];
            var element = undefined;
            if(i > 0) {
                element = {
                    customerNumber: undefined,
                    category: undefined,
                    firstname: undefined,
                    lastname: undefined,
                    fullname: undefined,
                    birthdate: undefined,
                    isBlocked: undefined
                };
                const richElement = setData(element, record);
                elements.push(richElement);
            } else {
                element = elements[i];
                setData(element, record);
            }
        }
        return elements;

    })

    function setData(element, record) {
        element.ID = uuidv4();
        element.customerNumber = record.ID;
        element.category = record.category;
        element.firstname = record.firstname;
        element.lastname = record.lastname;
        element.fullname = record.fullname;
        element.birthdate = (record.birthdate === null) ? '' : record.birthdate;
        element.isBlocked = record.isBlocked;


        if(record.to_BusinessPartnerAddress[0]) {
            const businessPartnerAddress = record.to_BusinessPartnerAddress[0];
            element.city = businessPartnerAddress.CityName;
            element.street = businessPartnerAddress.StreetName;
            element.zip = businessPartnerAddress.PostalCode;
            element.region = businessPartnerAddress.Region;
            element.country = businessPartnerAddress.Country;
        }

        return element;
    }


    // this.on('READ', 'Customer', async (req) => {
    //     console.log(req.query);
    //     const results = await bupa.run(SELECT.from(A_BusinessPartner, bp => {
    //         bp('BusinessPartner, BusinessPartnerCategory, FirstName, LastName, BusinessPartnerFullName, BirthDate, BusinessPartnerIsBlocked'),
    //         bp.to_BusinessPartnerAddress(address => {
    //             address('*')
    //         })
    //     }));
        
    //     return results;
    // })

    // this.on('READ', 'Customer', async (req) => {
    //     console.log(req.query);
    //     const results = await bupa.run({
    //         SELECT:{
    //             from:{
    //                 ref: ['CustomerManagement.BusinessPartner']},
    //                 columns: [{ref:['ID']},
    //                 {ref:['addresses.city']},
    //                 {expand: {ref:['city']}}]
    //         }
    //     });
        
    //     return results;
    // })

    // this.on('READ', 'BusinessPartner', req => {
    //     console.log(req.query);
    //     // const results = await bupa.run(SELECT.from(A_BusinessPartner, bp => {
    //     //     bp('BusinessPartner'),
    //     //     bp.to_BusinessPartnerAddress(addresses => {
    //     //         addresses('*')
    //     //     })
    //     // }).columns('BusinessPartner', 'FirstName', 'LastName').limit(100));

    //     // req.req._parsedOriginalUrl._raw += '?$expand=addresses';

    //     return bupa.run(req.query);
    // })

    // this.on('READ', 'BusinessPartnerAddress', req => {
    //     console.log(req.query);
    //     return bupa.run(req.query);
    // });
})