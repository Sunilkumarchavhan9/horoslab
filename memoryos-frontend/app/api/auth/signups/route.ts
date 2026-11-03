import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "signups.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        total: 0,
        signups: [],
      });
    }

    const content = fs.readFileSync(filePath, "utf8");
    const signups = JSON.parse(content);

    return NextResponse.json({
      total: signups.length,
      signups,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to read signups", details: error?.message },
      { status: 500 }
    );
  }
}

