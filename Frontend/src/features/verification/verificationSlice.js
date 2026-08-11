import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/apiClient.js";

// Async Thunks
export const fetchAvailableInheritances = createAsyncThunk(
  "verification/fetchAvailableInheritances",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/verification/available");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitNomineeAccessRequest = createAsyncThunk(
  "verification/submitNomineeAccessRequest",
  async ({ nomineeId, assetId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/access-requests", {
        nomineeId,
        assetId,
      });
      return { response: response.data, nomineeId, assetId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchReleasedAsset = createAsyncThunk(
  "verification/fetchReleasedAsset",
  async (assetId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/verification/released/${assetId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  inheritances: [],
  releasedAsset: null,
  loading: false,
  error: null,
};

const verificationSlice = createSlice({
  name: "verification",
  initialState,
  reducers: {
    clearReleasedAsset: (state) => {
      state.releasedAsset = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Available
      .addCase(fetchAvailableInheritances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableInheritances.fulfilled, (state, action) => {
        state.loading = false;
        state.inheritances = action.payload;
      })
      .addCase(fetchAvailableInheritances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit Access Request
      .addCase(submitNomineeAccessRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitNomineeAccessRequest.fulfilled, (state, action) => {
        state.loading = false;
        const { nomineeId, assetId, response } = action.payload;
        // Update request status for the asset locally in store
        state.inheritances = state.inheritances.map((inh) => {
          if (inh.nomineeId === nomineeId) {
            return {
              ...inh,
              assets: inh.assets.map((asset) => {
                if (asset._id === assetId) {
                  return {
                    ...asset,
                    requestStatus: "ADMIN_REVIEW",
                    requestId: response._id,
                  };
                }
                return asset;
              }),
            };
          }
          return inh;
        });
      })
      .addCase(submitNomineeAccessRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Released Asset Details
      .addCase(fetchReleasedAsset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReleasedAsset.fulfilled, (state, action) => {
        state.loading = false;
        state.releasedAsset = action.payload;
      })
      .addCase(fetchReleasedAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReleasedAsset } = verificationSlice.actions;
export default verificationSlice.reducer;
