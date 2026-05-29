import { NextRequest, NextResponse } from "next/server";
import { queryMoneyPrinterTask } from "@/lib/moneyprinter";
import { taskIdSchema } from "@/lib/validators/video.schemas";

export async function GET(_request: NextRequest, { params }: { params: { taskId: string } }) {
  const taskId = taskIdSchema.parse(params.taskId);
  const result = await queryMoneyPrinterTask(taskId);

  return NextResponse.json({
    ok: true,
    task: result.task
  });
}
