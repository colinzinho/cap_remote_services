using { OP_API_BUSINESS_PARTNER_SRV as bupa } from '../srv/external/OP_API_BUSINESS_PARTNER_SRV.cds';

namespace ch.cspi;

// two entities from the same api
entity A_BusinessPartner as projection on bupa.A_BusinessPartner {
    key BusinessPartner,
        FirstName,
        LastName,
        BusinessPartnerIsBlocked,
        to_BusinessPartnerAddress
}

entity A_BusinessPartnerAddress as projection on bupa.A_BusinessPartnerAddress {
    key BusinessPartner,
    key AddressID,
        CityName,
        StreetName,
        PostalCode,
        Region,
        Country
}