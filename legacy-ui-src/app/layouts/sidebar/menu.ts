import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [

    // For Consumer start

    {
        id: 101,
        label: 'Operations',
        iconPath: 'assets/menuIcon/menu-dash.svg',
        link:'/adlp/admin/dashboardAdmin',
        subItems:[
            {
                id: 1010,
                label: 'Dashboard',
                link:'/adlp/admin/admindashboard/dashboardfleet',
                parentId:101
            },
            {
                id: 1011,
                label: 'Fleet Summary',
                link:'/adlp/admin/fleetManageVehicles',
                parentId:101
            },
            {
                id: 1012,
                label: 'Tracking',
                link:'/adlp/admin/admindashboard/tracking',
                parentId:101
            },
            {
                id: 1013,
                label: 'Dashcam',
                icon: 'bx-camera',
                parentId:101,
                subItems: [
                    {
                        id: 10111,
                        label: 'Safety Events',
                        link: '/adlp/admin/admindashboard/safety-events',
                        parentId: 1013
                    },
                    {
                        id: 10112,
                        label: 'Live View',
                        link: '/adlp/admin/admindashboard/live-view',
                        parentId: 1013
                    },
                    {
                        id: 10113,
                        label: 'Video',
                        link: '/adlp/admin/admindashboard/template-portal',
                        parentId: 1013
                    },

                ]
            },
            {
                id: 1014,
                label: 'Safety',
                parentId:101,
                subItems: [
                    {
                        id: 10121,
                        label: 'Driver Behavior',
                        link: '/adlp/admin/admindashboard/dashboardfleet/fleet-safety-card',
                        parentId: 1014
                    },
                    {
                        id: 10122,
                        label: 'Collision',
                        link: '/adlp/admin/admindashboard/dashboardfleet/safetyCollision/safetyCollsion',
                        parentId: 1014
                    },
                    {
                        id: 10213,
                        label: 'ADAS',
                        link: '/adlp/admin/admindashboard/adasDashboard',
                        parentId: 1014
                    },

                ]
            },
            {
                id: 1015,
                label: 'Sustainability',
                icon: 'bx-refresh',
                parentId:101,
                subItems: [
                    {
                        id: 10151,
                        label: 'Fuel',
                        link: '/adlp/admin/admindashboard/dashboardfleet/fuel',
                        parentId: 1015
                    },
                    {
                        id: 10152,
                        label: 'EV',
                        link: '/adlp/admin/admindashboard/dashboardfleet/ev',
                        parentId: 1015
                    },
                ]
            },
            {
                id: 1016,
                label: 'Maintenance',
                icon: 'bxs-car-mechanic',
                parentId:101,
                subItems: [
                    {
                        id: 10161,
                        label: 'Service Warnings',
                        link: '/adlp/admin/admindashboard/dashboardfleet/fleet-maintenance',
                        parentId: 1016
                    },
                    {
                        id: 10162,
                        label: 'Service History',
                        link: '/adlp/admin/admindashboard/maintenance/serviceHistory',
                        parentId: 1016
                    },
                ]
            },




        ]
    },

    {
        id: 102,
        label: 'Reports',
        icon: 'bxs-report',
        iconPath: 'assets/menuIcon/menu-report.svg',
        subItems: [
            {
                id: 1211,
                label: 'Productivity',
                link: '/adlp/admin/admindashboard/report',
                parentId: 102
            },
            {
                id: 1212,
                label: 'Custom',
                link: '/adlp/admin/admindashboard/custom',
                parentId: 102
            },
            {
                id: 1213,
                label: 'Geofence',
                link: '/adlp/admin/admindashboard/geofence/manage-geofence',
                parentId: 102
            },
            {
                id: 1214,
                label: 'TCO',
                link: '/adlp/dashboards/tcosearchfleet',
                parentId: 102
            },

        ]
    },

    {
        id: 103,
        label: 'Settings',
        iconPath: 'assets/menuIcon/menu-setting.svg',
        link:'setting',
        subItems:[

            {
                id: 1311,
                label: 'Vehicles',
                icon: 'bx-camera',
                parentId:103,
                subItems: [
                    {
                        id: 13111,
                        label: 'VIN eligibility',
                        link: '/adlp/eligibility/eligibilityCheck',
                        parentId: 1311
                    },

                ]
            },
            {
                id: 1312,
                label: 'Geofence',
                icon: 'bxs-report',
                parentId:103,
                subItems: [
                    {
                        id: 13121,
                        label: 'Manage Geofence',
                        link: '/adlp/admin/admindashboard/geoFenceSetup/geofence2',
                        parentId: 1312
                    },
                    {
                        id: 13122,
                        label: 'Set Geofence ',
                        link: '/adlp/admin/admindashboard/geoFenceSetup/addGeofence',
                        parentId: 1312
                    },
                ]
            },
            {
                id: 1313,
                label: 'Service Reminders',
                link: '/adlp/admin/admindashboard/maintenance/serviceReminder/serviceReminders',
                parentId: 103
            },
            {
                id: 1314,
                label: 'Groups',
                link: '/adlp/admin/admindashboard/manage-group',
                parentId: 103
            },
            {
                id: 1315,
                label: 'People',
                icon: 'bx-refresh',
                parentId:103,
                subItems: [
                    {
                        id: 13251,
                        label: 'Users',
                        link: 'admin/admindashboard/manage-user',
                        parentId: 1315
                    },
                    {
                        id: 13252,
                        label: 'Drivers',
                        link: '/adlp/admin/admindashboard/manageDriver/dashboardDriver',
                        parentId: 1315
                    },
                ]
            },
            {
                id: 1316,
                label: 'Notifications',
                link: 'admin/admindashboard/notification',
                parentId: 103
            },

            // {
            //     id: 26,
            //     label: 'Maintenance',
            //     icon: 'bxs-car-mechanic',
            //     parentId:1,
            //     subItems: [
            //         {
            //             id: 261,
            //             label: 'Service Warnings',
            //             link: '/adlp/admin/admindashboard/maintenance',
            //             parentId: 26
            //         },
            //         {
            //             id: 263,
            //             label: 'Service History',
            //             link: '/adlp/admin/admindashboard/maintenance/serviceHistory',
            //             parentId: 26
            //         },
            //     ]
            // },


                    // {
                    //     id: 32,
                    //     label: 'Configuration',
                    //     link: '/adlp/admin/admindashboard/configuration',
                    //     parentId: 3
                    // },

                    // {
                    //     id: 31,
                    //     label: 'Live View',
                    //     link: '/adlp/admin/admindashboard/live-view',
                    //     parentId: 3
                    // },


            // {
            //     id: 22,
            //     label: 'Video',
            //     link: '/adlp/admin/admindashboard/template-portal',
            //     parentId: 1
            // },


        ]
    },

];
