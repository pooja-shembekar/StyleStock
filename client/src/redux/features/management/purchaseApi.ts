import { baseApi } from "../baseApi";

const purchaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPurchases: builder.query({
      query: (query) => ({
        url: '/purchases',
        method: 'GET',
        params: query
      }),
      providesTags: ['purchases']
    }),

    createPurchase: builder.mutation({
      query: (payload) => ({
        url: '/purchases',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['purchases', 'product']
    }),

    deletePurchase: builder.mutation({
      query: (id) => ({
        url: '/purchases/' + id,
        method: 'DELETE',
      }),
      invalidatesTags: ['purchases']
    }),
    updatePurchase: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/purchases/${id}`,
        method: 'PATCH',
        body: payload
      }),
      invalidatesTags: ['purchases', 'product']
    }),
  })
})

export const {
  useGetAllPurchasesQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation
} = purchaseApi