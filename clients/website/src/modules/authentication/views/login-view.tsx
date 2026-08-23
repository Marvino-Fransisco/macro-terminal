"use client";

import { Field, FieldGroup, FieldSet } from "@/components/ui/field";
import { FormHeader } from "../components/form-header";
import { MainWrapper } from "../components/main-wrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function LoginView() {
  return (
    <MainWrapper>
      <FormHeader>
        <h1>Welcome back</h1>
      </FormHeader>
      <FieldSet className="w-full">
        <FieldGroup className="gap-4">
          <Field>
            <Input type="email" className="h-12" placeholder="Enter email address" required />
          </Field>
          <Field>
            <Button type="submit" className="rounded-full h-12">Continue</Button>
          </Field>
          <p className="text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold">Sign up</Link>
          </p>
        </FieldGroup>
      </FieldSet>
   </MainWrapper>
  )
}
