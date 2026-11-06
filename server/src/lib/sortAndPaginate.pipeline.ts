import { getPagination } from './queryUtils';

const sortAndPaginatePipeline = (query: Record<string, unknown>) => {
  const { page, limit } = getPagination(query);
  const sortBy = 'createdAt';
  let sortOrder: -1 | 1 = -1;

  if (query.sortOrder) {
    sortOrder = query.sortOrder === 'desc' ? -1 : 1;
  }

  return [
    {
      $sort: {
        [sortBy]: sortOrder,
        _id: sortOrder
      }
    },
    {
      $skip: limit * (page - 1)
    },
    {
      $limit: limit
    }
  ];
};

export default sortAndPaginatePipeline;
