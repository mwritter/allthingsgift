import z, { email } from "zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Button } from "../ui/button"
import { PartyPopper, Plus } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { Field, FieldError, FieldErrorProps } from "../ui/field"
import { Input } from "../ui/input"
import { addExchangeInvite } from "@/lib/exchanges"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SubmitEventHandler, useState } from "react"

const formSchema = z.object({
    email: z.email(),
})

export type InviteValues = z.input<typeof formSchema>

type Props = {
    exchangeId: string
}

export function ExchangeInvitesMemberDialog({ exchangeId }: Props) {
    const [open, setOpen] = useState(false)
    const [sentTo, setSentTo] = useState<string>()
    const [errorMessage, setErrorMessage] = useState<string>()
    const queryClient = useQueryClient()

    const sendInvite = useMutation({
        mutationFn: (email: string) => addExchangeInvite(exchangeId, email),
        onSuccess: (_, email) => {
            setSentTo(email)
            queryClient.invalidateQueries({ queryKey: ["exchange", exchangeId] })
        },
        onError: (error) => {
            setErrorMessage(error.message)
        }
    })

    const { handleSubmit, Field: FormField, reset: resetForm } = useForm({
        defaultValues: {
            email: ''
        },
        validators: {
            onSubmit: formSchema
        },
        onSubmit: async ({ value }) => {
            sendInvite.mutate(value.email)
        }
    })

    const onOpenChange = (open: boolean) => {
        setOpen(open)

        if (open) {
            resetForm()
            setSentTo(undefined)
            setErrorMessage(undefined)
        }
    }

    const onSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        handleSubmit()
    }

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger render={<Button className="self-start">
            <Plus />
            Invite Member
        </Button>} />
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogDescription>
                    We&apos;ll send an invite to this email.  Once the user logs in they can choose to accept the invite from within the app.
                </DialogDescription>
            </DialogHeader>
            {sentTo ? <SentMessage email={sentTo} /> :
                <form className="py-2" onSubmit={onSubmit}>
                    <FormField name="email">
                        {(field) => {
                            let errors = [] as FieldErrorProps['errors']
                            if (field.state.meta.isTouched && !field.state.meta.isValid && field.state.meta.errors.length) {
                                errors = field.state.meta.errors
                            } else if (errorMessage) {
                                errors = [{ message: errorMessage }]
                            }
                            const isInvalid = errors!.length > 0
                            return (
                                <div className="flex gap-2 items-start">
                                    <Field data-invalid={isInvalid}>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={e => field.handleChange(e.target.value)}
                                            aria-invalid={isInvalid}
                                            placeholder="member@gmail.com"
                                            autoComplete="off"
                                            disabled={sendInvite.isPending}
                                        />
                                        {isInvalid && (
                                            <FieldError errors={errors} />
                                        )}
                                    </Field>
                                    <Button className="self-start" type="submit" disabled={sendInvite.isPending}>Invite</Button>
                                </div>
                            )
                        }}
                    </FormField>

                </form>
            }
        </DialogContent>
    </Dialog>
}

function SentMessage({ email }: { email: string }) {
    return <div className="flex flex-col items-center gap-5 py-2">
        <PartyPopper size={50} />{' '}
        <p>We sent an invite to {email}!</p>
    </div>
}