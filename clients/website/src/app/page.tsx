import { ComponentCard } from "@/components/layout/component-card";
import { Button } from "../../lib/ui/components/button";
import { Input } from "../../lib/ui/components/input";
import { Label } from "../../lib/ui/components/label";
import { Textarea } from "../../lib/ui/components/text-area";
import { NativeSelect } from "../../lib/ui/components/native-select";
import { NativeOption } from "../../lib/ui/components/native-option";
import { NativeOptionGroup } from "../../lib/ui/components/native-option-group";
import { Checkbox } from "../../lib/ui/components/checkbox";

export default function Home() {
  return (
    <div>
      <main className="flex flex-col gap-4 p-4">
        <ComponentCard componentName="Buttons">
            <Button variant={"solid"} size={"md"}>
              Outline
            </Button>

            <Button variant={"outline"} size={"md"}>
              Outline
            </Button>

            <Button variant={"ghost"} size={"md"}>
              Ghost
            </Button>

            <Button variant={"destructive"} size={"md"}>
              Destructive
            </Button>
        </ComponentCard>

        <ComponentCard componentName="Inputs">
          <Input id="default" variant={"default"} />
          <Input id="error" variant={"error"} />
        </ComponentCard>

        <ComponentCard componentName="Label">
          <Label htmlFor="default">
            Input Default
          </Label>
          <Label htmlFor="error">
            Input Error
          </Label>
        </ComponentCard>

        <ComponentCard componentName="Text area">
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="default">
              Text area default
            </Label>
            <Textarea id="default" variant={"default"}/>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="error">
              Text area error
            </Label>
            <Textarea id="error" variant={"error"}/>
          </div>
        </ComponentCard>

        <ComponentCard componentName="Select">
          <NativeSelect variant={"default"} defaultValue="">
            <NativeOption value="">Select an option</NativeOption>
            <NativeOption value="1">Option 1</NativeOption>
            <NativeOption value="2">Option 2</NativeOption>
            <NativeOption value="3">Option 3</NativeOption>
          </NativeSelect>
          <NativeSelect variant={"error"}>
            <NativeOptionGroup label="Group 1">
              <NativeOption>Option 1</NativeOption>
              <NativeOption>Option 2</NativeOption>
            </NativeOptionGroup>
            <NativeOptionGroup label="Group 2">
              <NativeOption>Option 3</NativeOption>
            </NativeOptionGroup>
          </NativeSelect>
        </ComponentCard>

        <ComponentCard componentName="Checkbox">
          <Label htmlFor="cb1" className="flex items-center gap-1.5 leading-none">
            <Checkbox id="cb1" />
            Checkbox 1
          </Label>
          <Label htmlFor="cb2" variant={"error"} className="flex items-center gap-1.5 leading-none">
            <Checkbox id="cb2" variant={"error"} />
            Checkbox 2
          </Label>
        </ComponentCard>

      </main>
    </div>
  );
}
