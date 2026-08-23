import { Input } from "@/components/ui/input";
import { FormHeader } from "../components/form-header";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldSet } from "@/components/ui/field";
import Link from "next/link";
import { MainWrapper } from "../components/main-wrapper";

export function SignUpView() {
  return (
    <MainWrapper>
      <FormHeader>
        <h1>Create your free account</h1>
        <p className="hidden sm:block">
          Create your free account to start analysing or creating market thesis based on
          macroeconomics data.
        </p>
        <p className="sm:hidden">
          No credit card required. Cancel anytime.
        </p>
      </FormHeader>
      <FieldSet className="w-full">
        <FieldGroup className="gap-3">
          <Field>
            <Input type="email" className="h-12" placeholder="Enter email address" required />
          </Field>
          <Field>
            <Button type="submit" className="rounded-full h-12">Continue</Button>
          </Field>
          <p className="text-center">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold">Log in</Link>
          </p>
        </FieldGroup>
      </FieldSet>
    </MainWrapper>
  )
}
