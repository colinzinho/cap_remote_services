using { OP_API_BUSINESS_PARTNER_SRV as bupa } from './external/OP_API_BUSINESS_PARTNER_SRV.cds';

service CustomerManagement {
    @cds.persistence : {
        table,
        skip : false
    }
    entity BusinessPartner as projection on bupa.A_BusinessPartner {
        @title: '{i18n>ID}'
        key BusinessPartner as ID,
        @title: '{i18n>category}'
        BusinessPartnerCategory as category,
        @title: '{i18n>firstname}'
        FirstName as firstname,
        @title: '{i18n>lastname}'
        LastName as lastname,
        @title: '{i18n>fullname}'
        BusinessPartnerFullName as fullname,
        @title: '{i18n>birthdate}'
        BirthDate as birthdate,
        @title: '{i18n>isBlocked}'
        BusinessPartnerIsBlocked as isBlocked,
        to_BusinessPartnerAddress as addresses,

        @title: '{i18n>createdBy}'
        CreatedByUser as createdBy,
        @title: '{i18n>createdAt}'
        CreationDate as createdAt
    }

    entity BusinessPartnerAddress as projection on bupa.A_BusinessPartnerAddress{
        BusinessPartner as bupaID,
        AddressID as ID,
        @title: '{i18n>city}'
        CityName as city,
        @title: '{i18n>street}'
        StreetName as street,
        @title: '{i18n>zip}'
        PostalCode as zip,
        @title: '{i18n>region}'
        Region as region,
        @title: '{i18n>country}'
        Country as country
    }

    entity Customer {
        @title: '{i18n>ID}'
        key ID: Integer;
        @title: '{i18n>category}'
        category: String;
        @title: '{i18n>firstname}'
        firstname: String;
        @title: '{i18n>lastname}'
        lastname: String;
        @title: '{i18n>fullname}'
        fullname: String;
        @title: '{i18n>birthdate}'
        birthdate: String;
        @title: '{i18n>isBlocked}'
        isBlocked: Boolean;

        @title: '{i18n>city}'
        city: String;
        @title: '{i18n>street}'
        street: String;
        @title: '{i18n>zip}'
        zip: String;
        @title: '{i18n>region}'
        region: String;
        @title: '{i18n>country}'
        country: String
    }
}

annotate CustomerManagement.BusinessPartner with @(UI: {
    Identification: [{
        Value: ID
    }],
    SelectionFields: [
        ID,
        firstname,
        lastname,
        addresses.country
    ],
    LineItem: [
        {
            Value: ID
        },
        {
            Value: firstname
        },
        {
            Value: lastname
        },
        {
            Value: addresses.street
        },
        {
            Value: addresses.zip
        },
        {
            Value: addresses.city
        },
        {
            Value: addresses.region
        },
        {
            Value: addresses.country
        }
    ],
    HeaderInfo:{
        TypeName: '{i18n>customer}',
        TypeNamePlural: '{i18n>customers}',
        Title: {
            Value: {
                $edmJson: {
                    $Apply: [{
                            $Path: 'firstname'
                        },
                        ' ',
                        {
                            $Path: 'lastname'
                        },
                    ],
                    $Function: 'odata.concat',
                },
            },
        },
        Description: {
            Value: ID
        }
    },
    HeaderFacets: [
        {
            $Type: 'UI.ReferenceFacet',

            Target: '@UI.FieldGroup#details'
        }
    ],
    Facets: [
        {
            $Type: 'UI.ReferenceFacet',

            Label: '{i18n>customer_information}',

            Target: '@UI.FieldGroup#customer_information'
        },
        {
            $Type: 'UI.ReferenceFacet',

            Label: '{i18n>customer_address}',

            Target: '@UI.FieldGroup#customer_address'
        }
    ],
    FieldGroup#details: {
        Data: [{
                Value: createdBy
            },
            {
                Value: createdAt
            }
        ]
    },
    FieldGroup#customer_information: {
        Data: [{
                Value: ID
            },
            {
                Value: firstname
            },
            {
                Value: lastname
            },
            {
                Value: birthdate
            },
            {
                Value: isBlocked
            }
        ]
    },
    FieldGroup#customer_address: {
        Data: [{
                Value: addresses.street
            },
            {
                Value: addresses.zip
            },
            {
                Value: addresses.city
            },
            {
                Value: addresses.region
            }
        ]
    }
});

annotate CustomerManagement.BusinessPartner with {
    ID @(
        Common.ValueList: {
            CollectionPath: 'BusinessPartner',
            Parameters: [{
                    $Type: 'Common.ValueListParameterInOut',
                    LocalDataProperty: 'ID',
                    ValueListProperty: 'ID'
                },
                {
                    $Type: 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'firstname'
                },
                {
                    $Type: 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'lastname'
                }
            ]
        }
    )
};