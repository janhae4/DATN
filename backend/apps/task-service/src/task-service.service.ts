import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { RpcException } from '@nestjs/microservices';
import { TASK_ERRORS } from '@app/contracts/task/task.errors';
import { Task, TaskStatus } from './generated/prisma';
import { DateTimeResult } from './dto/dt-result.dto';
import { map, Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { TaskNerDto } from './dto/task-ner.dto';
import { HttpService } from '@nestjs/axios';
import { response } from 'express';
import { date } from 'joi';
import { PredictTaskDto } from './dto/predict-task.dto';

@Injectable()
export class TaskServiceService {
  constructor(private prisma: PrismaService, private httpService: HttpService) { }

  async findAll(): Promise<Task[]> {
    return await this.prisma.task.findMany();
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { taskId: id },
    });
    if (!task) {
      throw new RpcException(TASK_ERRORS.NOT_FOUND(id));
    }
    return task;
  }

  async create(data: {
    title: string;
    description?: string;
    deadline?: Date;
    priority?: number;
    status?: TaskStatus;
  }): Promise<Task> {
    return this.prisma.task.create({
      data,
    });
  }

  async update(id: number, data: UpdateTaskDto): Promise<Task> {
    const existing = await this.prisma.task.findUnique({
      where: { taskId: id },
    });
    if (!existing) {
      throw new RpcException(TASK_ERRORS.NOT_FOUND(id));
    }
    return this.prisma.task.update({
      where: { taskId: id },
      data,
    });
  }

  async remove(id: number): Promise<Task> {
    const existing = await this.prisma.task.findUnique({
      where: { taskId: id },
    });
    if (!existing) {
      throw new RpcException(TASK_ERRORS.NOT_FOUND(id));
    }
    return this.prisma.task.delete({
      where: { taskId: id },
    });
  }

  predict(text: string): Observable<PredictTaskDto> {
    return this.httpService.post<TaskNerDto>(
      'http://localhost:8000/predict',
      { text },
      { headers: { 'Content-Type': 'application/json' } },
    ).pipe(
      map((response: AxiosResponse<TaskNerDto>) => {
        const nerResult = response.data;
        const priority = this.detectPriority(text);
        const dtResult = this.detectDatetimeRange(text);
        return { ...nerResult, priority, datetime: dtResult };
      })
    )
  }

  detectPriority(text: string, currentDate: Date = new Date()): number {
    text = text.toLowerCase();

    const PRIORITY_KEYWORDS: Record<number, string[]> = {
      3: [
        "gấp",
        "khẩn",
        "ưu tiên",
        "deadline",
        "ngay",
        "ngay lập tức",
        "phải làm liền",
        "hôm nay",
        "nay",
      ],
      2: ["nhớ", "đừng quên", "dự định", "nên làm", "mai"],
      1: ["để sau", "lúc rảnh", "không gấp", "lát nữa", "mốt"],
    };

    for (const score in PRIORITY_KEYWORDS) {
      const keywords = PRIORITY_KEYWORDS[score];
      if (keywords.some((kw) => text.includes(kw))) {
        if (Number(score) === 3) return 3;
      }
    }

    const timeRegex = /\b(\d{1,2}h|\d{1,2}:\d{2})\b/;
    const hasTime = timeRegex.test(text);
    const hasDate = ["mai", "mốt", "thứ", "ngày", "chủ nhật"].some((x) =>
      text.includes(x)
    );

    if (hasTime && !hasDate) return 3;

    if (text.includes("hôm nay") || text.includes("nay")) return 3;
    if (text.includes("mai")) return 2;
    if (text.includes("mốt")) return 1;

    return 2;
  }


  detectDatetimeRange(
    text: string,
    currentDate: Date = new Date()
  ): DateTimeResult {
    text = text.toLowerCase();

    const result: DateTimeResult = {
      date: null,
      time: null,
      duration: null,
    };

    const addDays = (base: Date, days: number): Date => {
      const newDate = new Date(base);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    };

    // === Detect exact date ===
    if (text.includes("hôm nay") || text.includes("nay")) {
      result.date = currentDate;
    }
    if (text.includes("ngày mai") || text.includes("mai")) {
      result.date = addDays(currentDate, 1);
    }
    if (text.includes("mốt")) {
      result.date = addDays(currentDate, 2);
    }
    if (text.includes("kia")) {
      result.date = addDays(currentDate, 3);
    }

    const timeMatch = text.match(/\b(\d{1,2})(?:h|g| giờ|:)(\d{0,2})?\b/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      let minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

      if ((text.includes("tối") || text.includes("chiều")) && hour < 12) {
        hour += 12;
      }

      const timeDate = new Date(currentDate);
      timeDate.setHours(hour, minute, 0, 0);
      result.time = timeDate;
    }

    const durMatch = text.match(/(\d+)\s*(phút|tiếng|giờ)\s*(nữa|sau|trong)?/);
    if (durMatch) {
      const amount = parseInt(durMatch[1]);
      const unit = durMatch[2];

      let durationMs = 0;
      if (unit === "phút") durationMs = amount * 60 * 1000;
      if (unit === "tiếng" || unit === "giờ") durationMs = amount * 60 * 60 * 1000;

      result.duration = durationMs;

      if (!result.date) {
        result.date = currentDate;
      }

      if (text.includes("nữa") || text.includes("sau")) {
        result.time = new Date(currentDate.getTime() + durationMs);
      }
    }

    // === Fuzzy dates ===
    const weekday = currentDate.getDay(); // 0 = Sun, 6 = Sat

    if (text.includes("cuối tuần sau")) {
      const delta = (6 - weekday) + 7;
      result.date = addDays(currentDate, delta);
    } else if (text.includes("cuối tuần")) {
      const delta = 6 - weekday;
      result.date = addDays(currentDate, delta);
    } else if (text.includes("đầu tuần sau")) {
      const delta = 7 - weekday;
      result.date = addDays(currentDate, delta);
    } else if (text.includes("đầu tuần")) {
      result.date = addDays(currentDate, -weekday);
    } else if (text.includes("cuối tháng") || text.includes("hết tháng")) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const lastDay = new Date(year, month, 0);
      result.date = lastDay;
    } else if (text.includes("đầu tháng sau")) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      result.date = new Date(year, month, 1);
    } else if (text.includes("cuối năm")) {
      result.date = new Date(currentDate.getFullYear(), 11, 31);
    } else if (text.includes("đầu năm sau")) {
      result.date = new Date(currentDate.getFullYear() + 1, 0, 1);
    }

    const BUOI_MAP: Record<string, number> = {
      sáng: 8,
      trưa: 12,
      chiều: 15,
      tối: 20,
    };

    for (const [buoi, hourVal] of Object.entries(BUOI_MAP)) {
      if (text.includes(`${buoi} mai`)) {
        result.date = addDays(currentDate, 1);
        const t = new Date(currentDate);
        t.setHours(hourVal, 0, 0, 0);
        result.time = t;
      } else if (text.includes(`${buoi} nay`) || text.includes(buoi)) {
        if (!result.date) {
          result.date = currentDate;
        }
        const t = new Date(currentDate);
        t.setHours(hourVal, 0, 0, 0);
        result.time = t;
      }
    }

    return result;
  }

}
