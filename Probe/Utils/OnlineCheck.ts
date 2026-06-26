import PingMonitor from "./Monitors/MonitorTypes/PingMonitor";
import PortMonitor from "./Monitors/MonitorTypes/PortMonitor";
import WebsiteMonitor from "./Monitors/MonitorTypes/WebsiteMonitor";
import Hostname from "Common/Types/API/Hostname";
import URL from "Common/Types/API/URL";
import Port from "Common/Types/Port";
import { IsBillingEnabled } from "Common/Server/EnvironmentConfig";

type OnlineCheckMonitorType = "website" | "ping" | "port";
type OnlineCheckStatus = "success" | "failed";

interface OnlineCheckMetric {
  monitorType: OnlineCheckMonitorType;
  target: string;
  status: OnlineCheckStatus;
  latencyMs: number;
  timestamp: string;
  failureType?: string;
}

export default class OnlineCheck {
  private static recordMetric(metric: OnlineCheckMetric): void {
    console.log(
      JSON.stringify({
        event: "probe_online_check",
        ...metric,
      }),
    );
  }

  private static getLatencyMs(startTime: number): number {
    return Date.now() - startTime;
  }

  private static getFailureType(error: unknown): string {
    if (!(error instanceof Error)) {
      return "unknown_error";
    }

    const message: string = error.message.toLowerCase();

    if (message.includes("timeout") || message.includes("timed out")) {
      return "timeout";
    }

    if (
      message.includes("enotfound") ||
      message.includes("eai_again") ||
      message.includes("dns")
    ) {
      return "dns_error";
    }

    if (
      message.includes("certificate") ||
      message.includes("tls") ||
      message.includes("ssl")
    ) {
      return "tls_error";
    }

    if (
      message.includes("econnrefused") ||
      message.includes("econnreset") ||
      message.includes("network")
    ) {
      return "network_error";
    }

    if (message.includes("http")) {
      return "http_error";
    }

    return "unknown_error";
  }

  // burn domain names into the code to see if this probe is online.
  public static async canProbeMonitorWebsiteMonitors(): Promise<boolean> {
    if (!IsBillingEnabled) {
      /*
       * if the billing is not enabled which means its non on SaaS but self-hosted.
       * in this case return true as we don't need to check for online status.
       */
      return true;
    }

    const websiteNames: Array<string> = [
      "https://google.com",
      "https://facebook.com",
      "https://microsoft.com",
      "https://youtube.com",
      "https://apple.com",
    ];

    for (const websiteName of websiteNames) {
      const startTime: number = Date.now();

      try {
        const result = await WebsiteMonitor.ping(URL.fromString(websiteName), {
          isOnlineCheckRequest: true,
        });

        OnlineCheck.recordMetric({
          monitorType: "website",
          target: websiteName,
          status: result?.isOnline ? "success" : "failed",
          latencyMs: OnlineCheck.getLatencyMs(startTime),
          timestamp: new Date().toISOString(),
          ...(result?.isOnline ? {} : { failureType: "http_error" }),
        });

        if (result?.isOnline) {
          return true;
        }
      } catch (error) {
        OnlineCheck.recordMetric({
          monitorType: "website",
          target: websiteName,
          status: "failed",
          latencyMs: OnlineCheck.getLatencyMs(startTime),
          timestamp: new Date().toISOString(),
          failureType: OnlineCheck.getFailureType(error),
        });
      }
    }

    return false;
  }

  public static async canProbeMonitorPingMonitors(): Promise<boolean> {
    if (!IsBillingEnabled) {
      /*
       * if the billing is not enabled which means its non on SaaS but self-hosted.
       * in this case return true as we don't need to check for online status.
       */
      return true;
    }

    const domains: Array<string> = [
      "google.com",
      "facebook.com",
      "microsoft.com",
      "youtube.com",
      "apple.com",
    ];

    for (const domain of domains) {
      const startTime: number = Date.now();

      try {
        const result = await PingMonitor.ping(new Hostname(domain), {
          isOnlineCheckRequest: true,
        });

        OnlineCheck.recordMetric({
          monitorType: "ping",
          target: domain,
          status: result?.isOnline ? "success" : "failed",
          latencyMs: OnlineCheck.getLatencyMs(startTime),
          timestamp: new Date().toISOString(),
          ...(result?.isOnline ? {} : { failureType: "network_error" }),
        });

        if (result?.isOnline) {
          return true;
        }
      } catch (error) {
        OnlineCheck.recordMetric({
          monitorType: "ping",
          target: domain,
          status: "failed",
          latencyMs: OnlineCheck.getLatencyMs(startTime),
          timestamp: new Date().toISOString(),
          failureType: OnlineCheck.getFailureType(error),
        });
      }
    }

    return false;
  }

  public static async canProbeMonitorPortMonitors(): Promise<boolean> {
    if (!IsBillingEnabled) {
      /*
       * if the billing is not enabled which means its non on SaaS but self-hosted.
       * in this case return true as we don't need to check for online status.
       */
      return true;
    }

    const domains: Array<string> = [
      "google.com",
      "facebook.com",
      "microsoft.com",
      "youtube.com",
      "apple.com",
    ];

    for (const domain of domains) {
      const startTime: number = Date.now();

      try {
        const result = await PortMonitor.ping(
          new Hostname(domain),
          new Port(80),
          {
            isOnlineCheckRequest: true,
          },
        );

        OnlineCheck.recordMetric({
          monitorType: "port",
          target: domain,
          status: result?.isOnline ? "success" : "failed",
          latencyMs: OnlineCheck.getLatencyMs(startTime),
          timestamp: new Date().toISOString(),
          ...(result?.isOnline ? {} : { failureType: "network_error" }),
        });

        if (result?.isOnline) {
          return true;
        }
      } catch (error) {
        OnlineCheck.recordMetric({
          monitorType: "port",
          target: domain,
          status: "failed",
          latencyMs: OnlineCheck.getLatencyMs(startTime),
          timestamp: new Date().toISOString(),
          failureType: OnlineCheck.getFailureType(error),
        });
      }
    }

    return false;
  }
}