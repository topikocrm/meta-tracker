import { Loader } from 'lucide-react'

interface LoadingOverlayProps {
  message?: string
  fullScreen?: boolean
}

export default function LoadingOverlay({ 
  message = 'Loading...', 
  fullScreen = false 
}: LoadingOverlayProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3 shadow-xl">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-700 font-medium">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40 rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  )
}