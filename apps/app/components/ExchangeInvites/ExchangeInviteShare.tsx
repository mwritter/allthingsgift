import { QRCode } from 'react-qrcode-logo';
import { Button } from "@allthingsgift/ui/components/button";
import { basePath } from "@/lib/base-path";
import { Link } from 'lucide-react';
type Props = {
    exchangeId: string
}

export function ExchangeInviteShare({ exchangeId }: Props) {
    const joinUrl = `${window.location.origin}${basePath}/exchanges/${exchangeId}/join`

    return <div className='flex flex-col gap-4'>
        <div className="flex flex-col w-full max-w-55 mx-auto aspect-square [&>canvas]:w-full! [&>canvas]:h-auto!">
            <QRCode
                value={joinUrl}
                size={220}
                quietZone={10}
                bgColor="#F8FAFC"
                qrStyle="fluid"
                fgColor="#2A7B61"
                eyeColor={[
                    { outer: '#2A7B61', inner: '#7A9C8B' },
                    { outer: '#2A7B61', inner: '#7A9C8B' },
                    { outer: '#2A7B61', inner: '#7A9C8B' },
                ]}
                eyeRadius={[
                    { outer: [5, 5, 10, 5], inner: [5, 5, 5, 5] },
                    { outer: [5, 5, 5, 10], inner: [5, 5, 5, 5] },
                    { outer: [5, 10, 5, 5], inner: [5, 5, 5, 5] },
                ]}
            />
        </div>
        <div className='flex flex-col items-center gap-2'>
            <p className="text-xs">Scan to request and invite to this exchange.</p>
            <ShareButton link={joinUrl} />
        </div>
    </div>
}


function ShareButton({ link }: { link: string }) {

    const onShare = async () => {
        const shareData = {
            url: link
        }

        if (navigator.share && navigator.canShare?.(shareData)) {
            try {
                await navigator.share(shareData)
            } catch { }
            return
        }

        // TODO: we need a toast or something to indicate its copied to clipboard
        await navigator.clipboard.writeText(link)
    }

    return <Button type="button" onClick={onShare}><Link /> Share Link</Button>
}