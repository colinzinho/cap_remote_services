// using { ch.cspi as db } from '../db/schema';

using { OP_API_BUSINESS_PARTNER_SRV as bupa } from './external/OP_API_BUSINESS_PARTNER_SRV.cds';

service RiskService {
    @cds.persistence :  {
        table,
        skip : false
    }
    entity Suppliers as projection on bupa.A_BusinessPartner {
        key BusinessPartner as ID,
        BusinessPartnerFullName as fullname,
        BusinessPartnerIsBlocked as isBlocked
    }

    // entity Suppliers as projection on db.Suppliers;
}