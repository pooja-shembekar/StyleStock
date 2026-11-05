import { baseApi } from "../baseApi";

const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: (query) => ({
        url: '/products',
        method: 'GET',
        params: query
      }),
      providesTags: ['product']
    }),
    countProducts: builder.query({
      query: (query) => ({
        url: '/products/total',
        method: 'GET',
        params: query
      }),
      providesTags: ['product']
    }),
    getLowStockProducts: builder.query({
      query: () => ({
        url: '/products/low-stock',
        method: 'GET'
      }),
      providesTags: ['product']
    }),
    getSingleProduct: builder.query({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'GET'
      }),
      providesTags: ['product']
    }),
    getProductMovements: builder.query({
      query: ({ id, ...params }) => ({
        url: `/products/${id}/movements`,
        method: 'GET',
        params,
      }),
      providesTags: ['product'],
    }),
    getProductNotes: builder.query({
      query: (id) => ({
        url: `/products/${id}/notes`,
        method: 'GET',
      }),
      providesTags: ['product'],
    }),
    createProductNote: builder.mutation({
      query: ({ id, body }) => ({
        url: `/products/${id}/notes`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: ['product'],
    }),
    deleteProductNote: builder.mutation({
      query: ({ id, noteId }) => ({
        url: `/products/${id}/notes/${noteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['product'],
    }),
    createNewProduct: builder.mutation({
      query: (payload) => ({
        url: '/products',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['product', 'purchases']
    }),
    addStock: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/products/${id}/add`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['product', 'purchases']
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['product']
    }),
    updateProduct: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: payload
      }),
      invalidatesTags: ['product']
    }),
    bulkDelete: builder.mutation({
      query: (payload) => ({
        url: '/products/bulk-delete',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['product']
    }),
  })
})

export const {
  useGetAllProductsQuery,
  useCountProductsQuery,
  useGetLowStockProductsQuery,
  useCreateNewProductMutation,
  useAddStockMutation,
  useDeleteProductMutation,
  useGetSingleProductQuery,
  useGetProductMovementsQuery,
  useGetProductNotesQuery,
  useCreateProductNoteMutation,
  useDeleteProductNoteMutation,
  useUpdateProductMutation,
  useBulkDeleteMutation } = productApi