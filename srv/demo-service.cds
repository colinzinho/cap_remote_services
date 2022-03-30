using { OP_API_BUSINESS_PARTNER_SRV as bupa } from './external/OP_API_BUSINESS_PARTNER_SRV.cds';
using { cuid } from '@sap/cds/common';

service DemoService {
    
    entity A_BusinessPartner as projection on bupa.A_BusinessPartner {
        *
    };

    entity A_BusinessPartnerAddress as projection on bupa.A_BusinessPartnerAddress {
        *
    };

    entity BusinessPartner: cuid {
        key BusinessPartner: String(40);
            FirstName: String(40);
            LastName: String(40);
            BusinessPartnerIsBlocked: Boolean;

            to_BusinessPartnerAddress: Association to one BusinessPartnerAddress;
    };

    entity BusinessPartnerAddress {
            CityName: String(40);
            StreetName: String(40);
            Region: String(40);
            Country: String(4);
    };
}

annotate DemoService.BusinessPartner with @(UI: {
    SelectionFields: [
        BusinessPartner,
        FirstName,
        LastName,
        
        to_BusinessPartnerAddress.Country,
    ],
    LineItem: [
        {
            Label: 'ID',
            Value: BusinessPartner
        },
        {
            Label: 'First Name',
            Value: FirstName
        },
        {
            Label: 'Last Name',
            Value: LastName
        },
        {
            Label: 'Street',
            Value: to_BusinessPartnerAddress.StreetName
        },
        {
            Label: 'City',
            Value: to_BusinessPartnerAddress.CityName
        },
        {
            Label: 'Country',
            Value: to_BusinessPartnerAddress.Country
        }
    ],
    HeaderInfo: {
        TypeName: 'Business Partner',
        TypeNamePlural: 'Business Partner',
        Title: {
            $Type: 'UI.DataField',
            Value: {
                $edmJson: {
                    $Apply: [{
                            $Path: 'FirstName'
                        },
                        ' ', 
                        {
                            $Path: 'LastName'
                        },
                    ],
                    $Function: 'odata.concat',
                },
            },
        },
        Description: {
            Value: BusinessPartner
        }
    },
});