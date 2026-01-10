import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      expand={false}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-slate-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-slate-600 group-[.toast]:text-sm",
          title: "group-[.toast]:text-slate-900 group-[.toast]:font-semibold",
          error: "group-[.toaster]:border-red-200 group-[.toaster]:bg-red-50",
          success: "group-[.toaster]:border-green-200 group-[.toaster]:bg-green-50",
          warning: "group-[.toaster]:border-yellow-200 group-[.toaster]:bg-yellow-50",
          info: "group-[.toaster]:border-blue-200 group-[.toaster]:bg-blue-50",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:hover:bg-blue-700 group-[.toast]:rounded-lg group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700 group-[.toast]:hover:bg-slate-200 group-[.toast]:rounded-lg group-[.toast]:font-medium",
          closeButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 group-[.toast]:hover:bg-slate-200 group-[.toast]:border-slate-200",
        },
        style: {
          borderRadius: '0.75rem',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
