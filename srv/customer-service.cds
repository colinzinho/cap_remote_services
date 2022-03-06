// using { ch.cspi as db } from '../db/schema';

using { OP_API_BUSINESS_PARTNER_SRV as bupa } from './external/OP_API_BUSINESS_PARTNER_SRV.cds';

service CustomerManagement {
    @cds.persistence : {
        table,
        skip : false
    }
    entity Customer as projection on bupa.A_BusinessPartner {
        key BusinessPartner as ID,
        BusinessPartnerFullName as fullname,
        BusinessPartnerIsBlocked as isBlocked
    }

    // entity Cutomer as projection on db.Customer;
}

annotate CustomerManagement.Customer with @(UI: {
    Identification: [{
        Value: ID
    }],
    SelectionFields: [
        ID,
        fullname,
        isBlocked
    ],
    LineItem: [
        {
            Label: 'ID',
            Value: ID
        },
        {
            Label: 'Full Name',
            Value: fullname
        },
        {
            Label: 'Is Blocked',
            Value: isBlocked
        }
    ]
});