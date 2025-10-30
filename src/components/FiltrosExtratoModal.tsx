import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Filter, X } from 'lucide-react'
import { FormField, FormLabel } from './ui/form'

interface FiltrosExtratoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: {
    status: string
    dateFrom: string
    dateTo: string
    minValue: string
    maxValue: string
  }
  onApplyFilters: (filters: any) => void
}

export function FiltrosExtratoModal({
  open,
  onOpenChange,
  filters: initialFilters,
  onApplyFilters,
}: FiltrosExtratoModalProps) {
  const [filters, setFilters] = useState(initialFilters)

  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters, open])

  const handleApply = () => {
    onApplyFilters(filters)
    onOpenChange(false)
  }

  const handleClear = () => {
    const clearedFilters = {
      status: 'all',
      dateFrom: '',
      dateTo: '',
      minValue: '',
      maxValue: '',
    }
    setFilters(clearedFilters)
    onApplyFilters(clearedFilters)
    onOpenChange(false)
  }

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'approved', label: 'Aprovado' },
    { value: 'pending', label: 'Pendente' },
    { value: 'rejected', label: 'Rejeitado' },
    { value: 'refunded', label: 'Reembolsado' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="text-primary" size={24} />
            Filtros de Extrato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtro de Status */}
          <FormField>
            <FormLabel>Status</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={filters.status === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, status: option.value })}
                  className={
                    filters.status === option.value
                      ? 'bg-primary text-black'
                      : 'border-gray-700 text-gray-300'
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </FormField>

          {/* Filtro de Data */}
          <div className="space-y-3">
            <FormLabel>Data e Hora</FormLabel>
            <div className="grid grid-cols-2 gap-3">
              <FormField>
                <label className="text-xs text-gray-400 mb-1 block">De</label>
                <Input
                  type="datetime-local"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white text-sm"
                />
              </FormField>
              <FormField>
                <label className="text-xs text-gray-400 mb-1 block">Até</label>
                <Input
                  type="datetime-local"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white text-sm"
                />
              </FormField>
            </div>
          </div>

          {/* Filtro de Valor */}
          <div className="space-y-3">
            <FormLabel>$ Valor</FormLabel>
            <div className="grid grid-cols-2 gap-3">
              <FormField>
                <label className="text-xs text-gray-400 mb-1 block">Mínimo</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    R$
                  </span>
                  <Input
                    type="number"
                    value={filters.minValue}
                    onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                    placeholder="0,00"
                    className="bg-gray-800 border-gray-700 text-white pl-10"
                    step="0.01"
                  />
                </div>
              </FormField>
              <FormField>
                <label className="text-xs text-gray-400 mb-1 block">Máximo</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    R$
                  </span>
                  <Input
                    type="number"
                    value={filters.maxValue}
                    onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                    placeholder="0,00"
                    className="bg-gray-800 border-gray-700 text-white pl-10"
                    step="0.01"
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex-1 border-gray-700"
            >
              <X size={16} className="mr-2" />
              Limpar
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-primary hover:bg-primary/90 text-black font-medium"
            >
              <Filter size={16} className="mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
