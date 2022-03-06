// using { ch.cspi as db } from '../db/schema';

using { OP_API_BUSINESS_PARTNER_SRV as bupa } from './external/OP_API_BUSINESS_PARTNER_SRV.cds';

service CustomerManagement {
    @cds.persistence : {
        table,
        skip : false
    }
    entity Customer as projection on bupa.A_BusinessPartner {
        key BusinessPartner as ID,
        FirstName as firstname,
        LastName as lastname,
        BusinessPartnerFullName as fullname,
        BusinessPartnerIsBlocked as isBlocked,
        to_BusinessPartnerAddress as addresses: redirected to CustomerAddresses
    }

    entity CustomerAddresses as projection on bupa.A_BusinessPartnerAddress{
        BusinessPartner as bupaID,
        AddressID as ID,
        CityName as city,
        StreetName as street,
        PostalCode as zip,
        Region as region,
        Country as country
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
            Label: 'First Name',
            Value: firstname
        },
        {
            Label: 'Last Name',
            Value: lastname
        },
        {
            Label: 'Street',
            Value: to_BuinessPartnerAddress.street
        },
        {
            Label: 'Postal Code',
            Value: to_BusinessPartnerAddress.zip
        },
        {
            Label: 'City',
            Value: to_BusinessPartnerAddress.city
        },
        {
            Label: 'Region',
            Value: to_BusinessPartnerAddress.region
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