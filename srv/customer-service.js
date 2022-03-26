const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {

    /* connect to service defined/ declared in package.json
     * cds.connect.to returns a promise resolving to the OP_API_BUSINESS_PARTNER_SRV instance
     * we await the promise to be resolved for further processing 
    */
    const bupa = await cds.connect.to('OP_API_BUSINESS_PARTNER_SRV');

    const { A_BusinessPartner, A_BusinessPartnerAddress } = bupa.entities;

    this.on('READ', 'Customer', async (req) => {
        console.log(req.query);
        const results = await bupa.run(SELECT.from(A_BusinessPartner, bp => {
            bp('BusinessPartner, BusinessPartnerCategory, FirstName, LastName, BusinessPartnerFullName, BirthDate, BusinessPartnerIsBlocked'),
            bp.to_BusinessPartnerAddress(address => {
                address('*')
            })
        }));

        return results;
    })

    this.on('READ', 'BusinessPartner', req => {
        console.log(req.query);
        // const results = await bupa.run(SELECT.from(A_BusinessPartner, bp => {
        //     bp('BusinessPartner'),
        //     bp.to_BusinessPartnerAddress(addresses => {
        //         addresses('*')
        //     })
        // }).columns('BusinessPartner', 'FirstName', 'LastName').limit(100));

        // req.req._parsedOriginalUrl._raw += '?$expand=addresses';

        return bupa.run(req.query);
    })

    this.on('READ', 'BusinessPartnerAddress', req => {
        console.log(req.query);
        return bupa.run(req.query);
    });
})