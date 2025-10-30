import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      expand={true}
      richColors
      closeButton
      duration={4000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-[#1a1f2e] group-[.toaster]:to-[#0f172a] group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-gray-700/50 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:min-h-[70px]',
          title: 'group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:text-base',
          description: 'group-[.toast]:text-gray-300 group-[.toast]:text-sm group-[.toast]:mt-1',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-black group-[.toast]:font-medium group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:rounded-lg group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-all',
          cancelButton:
            'group-[.toast]:bg-gray-700 group-[.toast]:text-white group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:rounded-lg group-[.toast]:hover:bg-gray-600 group-[.toast]:transition-all',
          closeButton:
            'group-[.toast]:bg-gray-800/50 group-[.toast]:text-gray-400 group-[.toast]:border-gray-700 group-[.toast]:hover:bg-gray-700 group-[.toast]:hover:text-white group-[.toast]:transition-all',
          success:
            'group-[.toast]:border-green-500/50 group-[.toast]:bg-gradient-to-r group-[.toast]:from-green-950/50 group-[.toast]:to-[#0f172a]',
          error:
            'group-[.toast]:border-red-500/50 group-[.toast]:bg-gradient-to-r group-[.toast]:from-red-950/50 group-[.toast]:to-[#0f172a]',
          warning:
            'group-[.toast]:border-yellow-500/50 group-[.toast]:bg-gradient-to-r group-[.toast]:from-yellow-950/50 group-[.toast]:to-[#0f172a]',
          info:
            'group-[.toast]:border-blue-500/50 group-[.toast]:bg-gradient-to-r group-[.toast]:from-blue-950/50 group-[.toast]:to-[#0f172a]',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
