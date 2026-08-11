import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/apiClient.js";

// Async Thunks
export const fetchAssets = createAsyncThunk(
  "assets/fetchAssets",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/assets");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAssetDetails = createAsyncThunk(
  "assets/fetchAssetDetails",
  async (assetId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/assets/${assetId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAsset = createAsyncThunk(
  "assets/createAsset",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/assets", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAsset = createAsyncThunk(
  "assets/updateAsset",
  async ({ assetId, formData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/assets/${assetId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAsset = createAsyncThunk(
  "assets/deleteAsset",
  async (assetId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/assets/${assetId}`);
      return assetId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  selectedAsset: null,
  loading: false,
  error: null,
};

const assetSlice = createSlice({
  name: "assets",
  initialState,
  reducers: {
    clearAssetDetails: (state) => {
      state.selectedAsset = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Assets
      .addCase(fetchAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Asset Details
      .addCase(fetchAssetDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAsset = action.payload;
      })
      .addCase(fetchAssetDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Asset
      .addCase(createAsset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAsset.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Asset
      .addCase(updateAsset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAsset.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
        if (state.selectedAsset?._id === action.payload._id) {
          state.selectedAsset = action.payload;
        }
      })
      .addCase(updateAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Asset
      .addCase(deleteAsset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item._id !== action.payload);
      })
      .addCase(deleteAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAssetDetails } = assetSlice.actions;
export default assetSlice.reducer;
