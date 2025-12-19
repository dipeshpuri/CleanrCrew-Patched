import { BookingState, ServiceOption } from "../types";

export type EmailType = 'confirmation' | 'invoice' | 'review';

export interface EmailContent {
  subject: string;
  body: string;
}

export const generateEmailContent = async (
  type: EmailType,
  booking: BookingState,
  serviceDetails?: ServiceOption
): Promise<EmailContent> => {
  const name = booking.customerName || "there";

  switch (type) {
    case 'confirmation':
      return {
        subject: "Booking Confirmed – CleanrCrew",
        body: `Hi ${name},

Your cleaning is confirmed for ${booking.date.toDateString()} at ${booking.timeSlot}.

Thank you for choosing CleanrCrew.`
      };
    case 'invoice':
      return {
        subject: "Payment Receipt – CleanrCrew",
        body: `Hi ${name},

Thank you for your payment.`
      };
    default:
      return {
        subject: "How was your clean?",
        body: `Hi ${name},

We’d love your feedback!`
      };
  }
};