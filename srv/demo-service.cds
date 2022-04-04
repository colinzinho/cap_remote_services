using { ch.cspi as db } from '../db/schema';
using { cuid } from '@sap/cds/common';

service DemoService {
    
    entity A_BusinessPartner as projection on db.A_BusinessPartner;

    entity A_BusinessPartnerAddress as projection on db.A_BusinessPartnerAddress;

    entity BusinessPartner as projection on db.BusinessPartner;
}

annotate DemoService.BusinessPartner with @(UI: {
    SelectionFields: [
        BusinessPartner,
        FirstName,
        LastName,
        Country,
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
            Value: StreetName
        },
        {
            Label: 'City',
            Value: CityName
        },
        {
            Label: 'Country',
            Value: Country
        }
    ],
    PresentationVariant: {
        Visualizations: [
            '@UI.LineItem'
        ],
        RequestAtLeast: [
            BusinessPartner
        ],
        SortOrder: [
            {
                Property: BusinessPartner,
                Descending: false
            }
        ]
    },
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
    Facets: [
        {
            $Type: 'UI.ReferenceFacet',

            Label: 'Customer Information',

            Target: '@UI.FieldGroup#customerInfo'
        },
        {
            $Type: 'UI.ReferenceFacet',

            Label: 'Customer Address',

            Target: '@UI.FieldGroup#customerAddress'
        }
    ],
    FieldGroup#customerInfo: {
        Data: [
            {
                Value: BusinessPartner
            },
            {
                Value: FirstName
            },
            {
                Value: LastName
            },
            {
                Value: BusinessPartnerIsBlocked
            }
        ]
    },
    FieldGroup#customerAddress:  {
        Data: [
            {
                Value: StreetName
            },
            {
                Value: CityName
            },
            {
                Value: Region
            },
            {
                Value: Country
            }
        ]
    }
});
annotate DemoService.BusinessPartner with @( // https://answers.sap.com/questions/13047732/display-draftadministrativedata-in-a-table.html
    Common: {
        SemanticKey: [FirstName, LastName]
    }
);
annotate DemoService.BusinessPartner with @odata.draft.enabled;