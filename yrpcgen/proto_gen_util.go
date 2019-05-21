package yrpcgen

import (
	"errors"
	"log"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/golang/protobuf/protoc-gen-go/descriptor"
)

func GetProtoServiceLeadingComments(fd *descriptor.FileDescriptorProto, service *descriptor.ServiceDescriptorProto) (error, string) {

	locs := fd.SourceCodeInfo.Location
	srvs := fd.Service

	if locs == nil {
		return nil, ""
	}

	srvIdx := -1

	//find msg idx
	for idx, srvItem := range srvs {
		if srvItem == service {
			srvIdx = idx
			break
		}
	}

	if srvIdx < 0 {
		return errors.New("not found service:" + *service.Name), ""
	}

	for _, loc := range locs {
		path := loc.Path

		if len(path) == 2 &&
			path[0] == 6 &&
			path[1] == int32(srvIdx) {
			if loc.LeadingComments != nil {
				return nil, *loc.LeadingComments
			} else {
				break
			}
		}
	}

	return nil, ""
}
func GetProtoRpcLeadingComments(fd *descriptor.FileDescriptorProto, service *descriptor.ServiceDescriptorProto, method *descriptor.MethodDescriptorProto) (error, string) {

	locs := fd.SourceCodeInfo.Location
	srvs := fd.Service
	methods := service.Method

	if locs == nil {
		return nil, ""
	}

	srvIdx := -1

	//find msg idx
	for idx, srvItem := range srvs {
		if srvItem == service {
			srvIdx = idx
			break
		}
	}

	if srvIdx < 0 {
		return errors.New("not found service:" + *service.Name), ""
	}

	methodIdx := -1
	for idx, fieldItem := range methods {
		if fieldItem == method {
			methodIdx = idx
			break
		}
	}

	if methodIdx < 0 {
		return errors.New("not found method:" + *method.Name), ""
	}

	for _, loc := range locs {
		path := loc.Path

		if len(path) == 4 &&
			path[0] == 6 &&
			path[1] == int32(srvIdx) &&
			path[2] == 2 &&
			path[3] == int32(methodIdx) {
			if loc.LeadingComments != nil {
				return nil, *loc.LeadingComments
			} else {
				break
			}
		}
	}

	return nil, ""
}
func GetProtoMsgLeadingComments(fd *descriptor.FileDescriptorProto, msg *descriptor.DescriptorProto) (error, string) {

	locs := fd.SourceCodeInfo.Location
	msgs := fd.MessageType

	if locs == nil {
		return nil, ""
	}

	msgIdx := -1

	//find msg idx
	for idx, msgItem := range msgs {
		if msgItem == msg {
			msgIdx = idx
			break
		}
	}

	if msgIdx < 0 {
		return errors.New("not found msg:" + *msg.Name), ""
	}

	for _, loc := range locs {
		path := loc.Path

		if len(path) == 2 &&
			path[0] == 4 &&
			path[1] == int32(msgIdx) {
			if loc.LeadingComments != nil {
				return nil, *loc.LeadingComments
			} else {
				break
			}
		}
	}

	return nil, ""
}

func GetProtoMsgFieldLeadingComments(fd *descriptor.FileDescriptorProto, msg *descriptor.DescriptorProto, field *descriptor.FieldDescriptorProto) (error, string) {
	locs := fd.SourceCodeInfo.Location
	msgs := fd.MessageType
	fields := msg.Field

	if locs == nil {
		return nil, ""
	}

	msgIdx := -1

	//find msg idx
	for idx, msgItem := range msgs {
		if msgItem == msg {
			msgIdx = idx
			break
		}
	}

	if msgIdx < 0 {
		return errors.New("not found msg:" + *msg.Name), ""
	}

	fieldIdx := -1
	for idx, fieldItem := range fields {
		if fieldItem == field {
			fieldIdx = idx
			break
		}
	}

	if fieldIdx < 0 {
		return errors.New("not found field:" + *field.Name), ""
	}

	for _, loc := range locs {
		path := loc.Path

		if len(path) == 4 &&
			path[0] == 4 &&
			path[1] == int32(msgIdx) &&
			path[2] == 2 &&
			path[3] == int32(fieldIdx) {
			if loc.LeadingComments != nil {
				return nil, *loc.LeadingComments
			} else {
				break
			}
		}
	}

	return nil, ""
}

//ExtractFilename (path is not removed)  path/filename.ext -> path/filename
func ExtractFilename(filenameWithExt string) string {
	var extension = filepath.Ext(filenameWithExt)
	return filenameWithExt[0 : len(filenameWithExt)-len(extension)]
}

//ISOTimeFormat iso time format yyyy-mm-dd HH:MM:SS
const ISOTimeFormat = "2006-01-02 15:04:05"

//NowTimeStrInLocal return yyyy-mm-dd hh:mm:ss in local time
func NowTimeStrInLocal() string {
	t := time.Now()
	return t.Format(ISOTimeFormat)
}

//NowTimeStrInUtc return yyyy-mm-dd hh:mm:ss in utc time
func NowTimeStrInUtc() string {
	t := time.Now().UTC()
	return t.Format(ISOTimeFormat)
}

//GolangName2SqlName golang name to the sql underscore name in proto
func GolangName2SqlName(golangName string) string {
	if len(golangName) == 0 {
		return ""
	}
	r := make([]rune, 0)
	for idx, c := range golangName {
		if idx == 0 {
			r = append(r, unicode.ToLower(c))
		} else {
			if unicode.IsUpper(c) {
				r = append(r, '_')
				r = append(r, unicode.ToLower(c))
			} else {
				r = append(r, c)
			}
		}
	}

	return string(r)
}

//SqlName2GolangName sql underscore name in proto to golang name mixedcaps
func SqlName2GolangName(sqlName string) string {
	if len(sqlName) == 0 {
		return ""
	}
	r := make([]rune, 0)

	needUpper := false
	for idx, c := range sqlName {
		if idx == 0 {
			r = append(r, unicode.ToUpper(c))
		} else {
			if needUpper {
				if unicode.IsDigit(c) {
					r = append(r, '_')
					r = append(r, c)
				} else {
					r = append(r, unicode.ToUpper(c))

				}
				needUpper = false
				continue
			}

			if c == '_' {
				needUpper = true
				continue
			} else {
				r = append(r, c)
			}
		}
	}

	return string(r)

}

// Is this field repeated?
func IsFieldRepeated(field *descriptor.FieldDescriptorProto) bool {
	return field.Label != nil && *field.Label == descriptor.FieldDescriptorProto_LABEL_REPEATED
}

//MakeDollarList return result like ($1,$2,...,$count)
func MakeDollarList(count int, with_brace bool) (r string) {

	tmp := strings.Builder{}
	if with_brace {
		tmp.WriteString("(")
	}
	for i := 0; i < count; i++ {
		if i != 0 {
			tmp.WriteString(",")
		}
		tmp.WriteString("$")
		tmp.WriteString(strconv.Itoa(i + 1))
	}

	if with_brace {
		tmp.WriteString(")")
	}
	return tmp.String()
}

func ProtoPackageName(d *descriptor.FileDescriptorProto) (name string) {

	// Does the file have a package clause?
	if pkg := d.GetPackage(); pkg != "" {
		return pkg
	}
	// Use the file base name.
	return baseName(d.GetName())
}

// baseName returns the last path element of the name, with the last dotted suffix removed.
func baseName(name string) string {
	// First, find the last element
	if i := strings.LastIndex(name, "/"); i >= 0 {
		name = name[i+1:]
	}
	// Now drop the suffix
	if i := strings.LastIndex(name, "."); i >= 0 {
		name = name[0:i]
	}
	return name
}

func protoComment2genComment(protoComments []string) (genComments []string) {
	for _, oneComment := range protoComments {
		if strings.HasPrefix(oneComment, "@") {
			continue
		}
		validComment := strings.Trim(oneComment, " \r\n")
		if len(validComment) == 0 {
			continue
		}
		genComments = append(genComments, oneComment)
	}

	return
}

func ProtoFieldIsRepeated(field *descriptor.FieldDescriptorProto) bool {
	return field.Label != nil && *field.Label == descriptor.FieldDescriptorProto_LABEL_REPEATED
}
func ProtoGoType(field *descriptor.FieldDescriptorProto) (typ string) {
	// TODO: Options.
	var wire string
	switch *field.Type {
	case descriptor.FieldDescriptorProto_TYPE_DOUBLE:
		typ, wire = "float64", "fixed64"
	case descriptor.FieldDescriptorProto_TYPE_FLOAT:
		typ, wire = "float32", "fixed32"
	case descriptor.FieldDescriptorProto_TYPE_INT64:
		typ, wire = "int64", "varint"
	case descriptor.FieldDescriptorProto_TYPE_UINT64:
		typ, wire = "uint64", "varint"
	case descriptor.FieldDescriptorProto_TYPE_INT32:
		typ, wire = "int32", "varint"
	case descriptor.FieldDescriptorProto_TYPE_UINT32:
		typ, wire = "uint32", "varint"
	case descriptor.FieldDescriptorProto_TYPE_FIXED64:
		typ, wire = "uint64", "fixed64"
	case descriptor.FieldDescriptorProto_TYPE_FIXED32:
		typ, wire = "uint32", "fixed32"
	case descriptor.FieldDescriptorProto_TYPE_BOOL:
		typ, wire = "bool", "varint"
	case descriptor.FieldDescriptorProto_TYPE_STRING:
		typ, wire = "string", "bytes"
	//case descriptor.FieldDescriptorProto_TYPE_GROUP:
	//	desc := g.ObjectNamed(field.GetTypeName())
	//	typ, wire = "*"+g.TypeName(desc), "group"
	//case descriptor.FieldDescriptorProto_TYPE_MESSAGE:
	//	desc := g.ObjectNamed(field.GetTypeName())
	//	typ, wire = "*"+g.TypeName(desc), "bytes"
	case descriptor.FieldDescriptorProto_TYPE_BYTES:
		typ, wire = "[]byte", "bytes"
	//case descriptor.FieldDescriptorProto_TYPE_ENUM:
	//	desc := g.ObjectNamed(field.GetTypeName())
	//	typ, wire = g.TypeName(desc), "varint"
	case descriptor.FieldDescriptorProto_TYPE_SFIXED32:
		typ, wire = "int32", "fixed32"
	case descriptor.FieldDescriptorProto_TYPE_SFIXED64:
		typ, wire = "int64", "fixed64"
	case descriptor.FieldDescriptorProto_TYPE_SINT32:
		typ, wire = "int32", "zigzag32"
	case descriptor.FieldDescriptorProto_TYPE_SINT64:
		typ, wire = "int64", "zigzag64"
	default:
		log.Fatal("unknown type for", field.GetName())
	}
	if ProtoFieldIsRepeated(field) {
		typ = "[]" + typ
	}
	_ = wire
	return
}
