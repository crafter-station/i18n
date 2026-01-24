import { sendEmail } from "@/tools/send-email";

const DEFAULT_EMAIL_RECIPIENTS = ["hi@cueva.io", "cris@kebo.app"];

interface ActionItem {
  id: string;
  type: "email" | "task" | "followup";
  title: string;
  description: string;
  assignee?: string;
  metadata: {
    recipients?: string[];
    subject?: string;
    emailBody?: string;
  };
}

interface ExecuteRequest {
  action: ActionItem;
  meetingSummary?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { action, meetingSummary }: ExecuteRequest = await req.json();

    if (!action) {
      return Response.json({ error: "Action is required" }, { status: 400 });
    }

    switch (action.type) {
      case "email": {
        const recipients =
          action.metadata.recipients?.length > 0
            ? action.metadata.recipients
            : DEFAULT_EMAIL_RECIPIENTS;

        const result = await sendEmail({
          to: recipients,
          subject: action.metadata.subject || `Meeting Update: ${action.title}`,
          body: action.metadata.emailBody || action.description,
          meetingSummary,
        });

        if (!result.success) {
          return Response.json(
            { error: result.error || "Failed to send email" },
            { status: 500 }
          );
        }

        return Response.json({
          success: true,
          type: "email",
          messageId: result.messageId,
          mocked: result.mocked,
          message: result.mocked
            ? "Email simulated (mock mode)"
            : `Email sent to ${recipients.join(", ")}`,
        });
      }

      case "task": {
        // Para demo, apenas simula criação de task
        return Response.json({
          success: true,
          type: "task",
          message: `Task "${action.title}" would be created`,
          mocked: true,
        });
      }

      case "followup": {
        // Para demo, apenas simula agendamento
        return Response.json({
          success: true,
          type: "followup",
          message: `Follow-up "${action.title}" would be scheduled`,
          mocked: true,
        });
      }

      default:
        return Response.json(
          { error: "Unknown action type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return Response.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
