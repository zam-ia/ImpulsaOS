export type DemoSession = {
  userId: string;
  businessId: string;
};

export function getDemoSession(): DemoSession {
  return {
    userId: "owner_demo",
    businessId: "biz_demo"
  };
}
