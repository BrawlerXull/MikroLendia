'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Community } from '@/types/type'
import { Users, Settings, LogIn } from 'lucide-react'
import { CommunityManageDialog } from './community-manage-dialog'
import { toast } from 'sonner'

interface CommunityCardProps {
  community: Community
  walletAddress: string
  onJoin: (communityId: string) => void
  loanRequests: any[]
  onApproveLoan: (loanId: number) => void
  owners: string[]
}

export default function CommunityCard({
  community,
  walletAddress,
  onJoin,
  owners,
}: CommunityCardProps) {
  const [manageOpen, setManageOpen] = useState(false)

  const isOwner = owners.some(
    o => o?.toLowerCase() === walletAddress?.toLowerCase()
  )

  return (
    <>
      <Card className={`glass relative overflow-hidden group flex flex-col h-full transition-all duration-300 ${
        isOwner ? 'border-primary/30 hover:border-primary/50' : 'border-border/50 hover:border-border'
      }`}>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Multi-Sig
            </Badge>
            {isOwner && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Owner
              </Badge>
            )}
          </div>

          <div className="pt-2">
            <CardTitle className="text-xl font-bold truncate">
              {community.name || 'Unnamed Community'}
            </CardTitle>
            <CardDescription className="font-mono text-xs mt-1 truncate" title={community.contractAddress}>
              {community.contractAddress}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex-grow space-y-4 text-sm">
          {/* Members */}
          <div className="bg-background/50 rounded-lg p-4 border border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Members
              </span>
              <span className="font-semibold">{owners.length} Owner{owners.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground block mb-2">Owner Addresses:</span>
              <div className="flex flex-wrap gap-1">
                {owners.slice(0, 3).map((owner, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded bg-muted text-xs font-mono ${
                      owner?.toLowerCase() === walletAddress?.toLowerCase()
                        ? 'bg-primary/10 text-primary'
                        : ''
                    }`}
                  >
                    {owner?.slice(0, 4)}...{owner?.slice(-4)}
                    {owner?.toLowerCase() === walletAddress?.toLowerCase() && ' (you)'}
                  </span>
                ))}
                {owners.length > 3 && (
                  <span className="px-2 py-1 rounded bg-muted text-xs">
                    +{owners.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/10">
            {isOwner
              ? 'You are an owner of this community. Open the dashboard to fund the pool, sign loan requests, or execute approved transactions.'
              : 'This community pools funds to issue loans with multi-signature approval from its owners.'}
          </p>
        </CardContent>

        <CardFooter className="pt-4 mt-auto">
          {isOwner ? (
            <Button
              className="w-full bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0 transition-all"
              onClick={() => setManageOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Community
            </Button>
          ) : (
            <Button
              className="w-full bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/30 transition-colors"
              onClick={() => {
                if (!walletAddress) {
                  toast.error('Connect your wallet first.')
                  return
                }
                setManageOpen(true)
              }}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Request Loan from Pool
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Community management dialog — only mounts when open to avoid hook init overhead */}
      {manageOpen && (
        <CommunityManageDialog
          open={manageOpen}
          onOpenChange={setManageOpen}
          communityAddress={community.contractAddress}
          walletAddress={walletAddress}
          isOwner={isOwner}
          defaultTab={isOwner ? 'requests' : 'request'}
        />
      )}
    </>
  )
}
