import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
    showNavbar: boolean;
}

const initialState: UiState = {
    showNavbar: true
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setShowNavbar: (state, action: PayloadAction<boolean>) => {
            state.showNavbar = action.payload;
        },
        toggleNavbar: (state) => {
            state.showNavbar = !state.showNavbar;
        }
    }
});

export const { setShowNavbar, toggleNavbar } = uiSlice.actions;
export default uiSlice.reducer;