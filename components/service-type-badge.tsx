import { Badge } from "@/components/ui/badge"
import { Shield, ExternalLink, Coins } from 'lucide-react'

interface ServiceTypeBadgeProps {
  type: 'pi_payment' | 'affiliate'
  className?: string
}

export function ServiceTypeBadge({ type, className = "" }: ServiceTypeBadgeProps) {
  if (type === 'pi_payment') {
    return (
      <Badge className={`bg-primary text-white ${className}`}>
        <Coins className="w-3 h-3 mr-1" />
        Pay with Pi
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={`border-secondary text-secondary ${className}`}>
      <ExternalLink className="w-3 h-3 mr-1" />
      Partner Site
    </Badge>
  )
}
