import { useState } from 'react'

export function usePagination(initialPage = 1, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(itemsPerPage)

  const offset = (currentPage - 1) * pageSize

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const nextPage = () => {
    setCurrentPage((prev) => prev + 1)
  }

  const previousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / pageSize)
  }

  return {
    currentPage,
    pageSize,
    offset,
    setPageSize,
    goToPage,
    nextPage,
    previousPage,
    getTotalPages,
  }
}
