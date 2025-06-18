import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import propertyReducer from './slices/propertySlice';
import userActivityReducer from './slices/userActivitySlice';
import { authMiddleware } from './middleware/authMiddleware';
import notificationReducer from './slices/notificationSlice';
import adminReducer from './slices/adminSlice';
import uiReducer from './slices/uiSlice';
import aiReducer from './slices/aiSlice'; // Add this import

// Root reducer configuration
const rootReducer = combineReducers({
    auth: authReducer,
    property: propertyReducer,
    userActivity: userActivityReducer,
    notifications: notificationReducer,
    admin: adminReducer,
    ui: uiReducer,
    ai: aiReducer, // Add the AI reducer
});

// Redux persist configuration
const persistConfig = {
    key: 'root',
    version: 1,
    storage,
    whitelist: ['auth'], // Only persist auth for now
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }).concat(authMiddleware),
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;