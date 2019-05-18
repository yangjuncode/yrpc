package util

import "time"

func GetUnixEpochInMilliseconds(t time.Time) int64 {
	return t.UnixNano() / int64(time.Millisecond)
}

func GetNowUnixEpochInMilliseconds() int64 {
	return time.Now().UnixNano() / int64(time.Millisecond)
}

//get now time as utc string
func GetNowTimeUtcStr() string {
	return GetTimeStr(time.Now().UTC())
}

//get now time as utc string yyyy-mm-dd hh:mm:ss.zzz
func GetNowTimeUtcStrzzz() string {
	return GetTimeStrzzz(time.Now().UTC())
}

//get now time as utc string
func GetNowTimeStr() string {
	return GetTimeStr(time.Now())
}

//get time string yyyy-mm-dd hh:mm:ss
func GetTimeStr(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}

//get time string yyyy-mm-dd hh:mm:ss.zzz
func GetTimeStrzzz(t time.Time) string {
	return t.Format("2006-01-02 15:04:05.000")
}
