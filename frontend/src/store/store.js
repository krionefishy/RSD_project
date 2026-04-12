import { configureStore } from "@reduxjs/toolkit";
import userSlice from "../features/user/slice";
import statusReducer from "../features/statusReducer";

export const store = configureStore({
  reducer: {
    user: userSlice,
    status: statusReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
