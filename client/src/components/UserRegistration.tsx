import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { contractService } from '@/lib/contract';

const formSchema = z.object({
  sponsorAddress: z.string().startsWith('0x')
});

export function UserRegistration() {
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sponsorAddress: ''
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsRegistering(true);
      await contractService.register(values.sponsorAddress);
      toast({
        title: "Registration successful",
        description: "You have been registered in the system"
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="sponsorAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sponsor Address</FormLabel>
              <FormControl>
                <Input placeholder="0x..." {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isRegistering}>
          {isRegistering ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </Form>
  );
}
