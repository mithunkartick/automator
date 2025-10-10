import React from 'react'
import { Button } from '../ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from '../ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@radix-ui/react-select'
import { Input } from '../ui/input'

type Props = {}

const ProfileForm = (props: Props) => {
  return (
    <div className="w-full max-w-md">
      <form>
        <FieldGroup>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="checkout-7j9-card-name-43j">
                  Name
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-name-43j"
                  placeholder="Evil Rabbit"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="checkout-7j9-card-number-uw1">
                  E-Mail Address
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-number-uw1"
                  placeholder="abc@xyz.com"
                  required
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSeparator />
          <Field orientation="horizontal">
            <Button variant="default" type="submit" className='self-start text-white bg-blue-500/70 hover:bg-blue-500'>
              Submit
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}

export default ProfileForm