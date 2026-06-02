export const personalTasks = [
  {
    id: 'p1',
    title: '買雞蛋',
    location: '全聯',
    locationMode: 'flexible',
    status: 'pending',
  },
  {
    id: 'p2',
    title: '交報告',
    location: '國立成功大學資訊工程學系',
    exactAddress: '701 台南市東區大學路 1 號',
    locationMode: 'fixed',
    status: 'in_progress',
  },
  {
    id: 'p3',
    title: '買生活用品',
    location: '超市',
    locationMode: 'flexible',
    status: 'completed',
  },
];

export const groups = [
  {
    id: 'grp1',
    name: '家庭',
    enabled: true,
    members: 4,
  },
  {
    id: 'grp2',
    name: '研究室',
    enabled: false,
    members: 3,
  },
  {
    id: 'grp3',
    name: '同學',
    enabled: true,
    members: 5,
  },
];

export const groupTasks = [
  {
    id: 'g1',
    title: '幫群組採買共用物資',
    location: '便利商店',
    locationMode: 'flexible',
    status: 'pending',
    groupId: 'grp2',
  },
  {
    id: 'g2',
    title: '一起去拿報告資料',
    location: '國立成功大學資訊工程學系',
    exactAddress: '701 台南市東區大學路 1 號光復校區國立成功大學',
    locationMode: 'fixed',
    status: 'pending',
    groupId: 'grp1',
  },
  {
    id: 'g3',
    title: '整理社團用品',
    location: '五金行',
    locationMode: 'flexible',
    status: 'completed',
    groupId: 'grp3',
  },
];

export const statusLabels = {
  pending: '待處理',
  in_progress: '進行中',
  completed: '已完成',
};
