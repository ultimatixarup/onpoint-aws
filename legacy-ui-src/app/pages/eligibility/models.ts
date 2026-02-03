export interface MVErrorState {
    vin: {
        errors: string[],
        status: null | undefined | boolean;
    },
    fleetId: {
        errors: string[],
        status: null | undefined | boolean;
    },
    vehicleOem: {
        errors: string[],
        status: null | undefined | boolean;
    },
    country: {
        errors: string[],
        status: null | undefined | boolean;
    },
    state: {
        errors: string[],
        status: null | undefined | boolean;
    },
    package: {
        errors: string[],
        status: null | undefined | boolean;
    },
    date: {
        errors: string[],
        status: null | undefined | boolean;
    },
}

export const initialMVErrorState: MVErrorState = {
    vin: {
        errors: [],
        status: false
    },
    fleetId: {
        errors: [],
        status: false
    },
    vehicleOem: {
        errors: [],
        status: false
    },
    country: {
        errors: [],
        status: false
    },
    state: {
        errors: [],
        status: false
    },
    package: {
        errors: [],
        status: false
    },
    date: {
        errors: [],
        status: false
    },
};
