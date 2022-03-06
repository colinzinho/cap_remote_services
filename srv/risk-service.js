const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {

    const bupa = await cds.connect.to('OP_API_BUSINESS_PARTNER_SRV');

    this.on('READ', 'Suppliers', async req => {
        console.log(req.query);
        return bupa.run(req.query);
    })
})