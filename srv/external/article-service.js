const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {

    const bupa = await cds.connect.to('OP_API_BUSINESS_PARTNER_SRV');

    this.on('READ', 'Customer', async(req) => {
        const results = await bupa.run(SELECT.from(A_BusinessPartner, bp => {
            bp('BusinessPartner, BusinessPartnerCategory, FirstName, LastName, BusinessPartnerFullName, BirthDate, BusinessPartnerIsBlocked'),
            bp.to_BusinessPartnerAddress(address => {
                address('*')
            })
        }));
        return results;
    })
})