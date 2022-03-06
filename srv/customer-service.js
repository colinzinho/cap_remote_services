const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {

    //ON_PREMISE_API_BUSINESS_PARTNER_SRV - connect to service
    const bupa = await cds.connect.to('OP_API_BUSINESS_PARTNER_SRV');

    const { A_BusinessPartner, A_BusinessPartnerAddress } = bupa.entities;

    this.on('READ', 'Customer', req => {
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

    this.on('READ', 'CustomerAddresses', req => {
        console.log(req.query);
        return bupa.run(req.query);
    });
})