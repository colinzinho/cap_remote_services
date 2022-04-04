using { OP_API_BUSINESS_PARTNER_SRV as bupa } from '../srv/external/OP_API_BUSINESS_PARTNER_SRV.cds';
using { cuid } from '@sap/cds/common';

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

entity BusinessPartner: cuid {
    key ID: UUID;
        @title: '{i18n>ID}'
        BusinessPartner: String(40);
        @title: '{i18n>firstname}'
        FirstName: String(40);
        @title: '{i18n>lastname}'
        LastName: String(40);
        @title: '{i18n>isBlocked}'
        BusinessPartnerIsBlocked: Boolean;
        @title: '{i18n>city}'
        CityName: String(40);
        @title: '{i18n>street}'
        StreetName: String(40);
        @title: '{i18n>region}'
        Region: String(40);
        @title: '{i18n>country}'
        Country: String(4);
};