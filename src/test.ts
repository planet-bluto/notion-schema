import { batch, Field, NotionSchemaClass, PropField } from "./index";

const schema = new NotionSchemaClass("not my secret")

let CONTENT

getContent()

async function getContent() {
  CONTENT = await batch({
    Art: schema.entries("not my database id", [
      Field("id"),
      PropField("Name", "title"),
      Field("icon"),
      PropField("text"),
      PropField("number"),
      PropField("url"),
      PropField("multi_select"),
      PropField("select"),
      PropField("status"),
      PropField("email"),
      PropField("checkbox"),
      PropField("person"),
      PropField("relation", "relation", {schema: [
        PropField("Name", "title"),
        PropField("text")
      ], flag: "single"}),
      PropField("relations", "relations", {schema: [
        PropField("Name", "title"),
        PropField("text")
      ]}),
      PropField("files"),
      PropField("date"),
      PropField("date_time"),
      PropField("date_time_end"),
      PropField("date_time_remind"),
      PropField("date_everything"),
      PropField("formula_string"),
      PropField("formula_num"),
      PropField("ID"),
      PropField("created_by"),
      PropField("created_time"),
      PropField("last_edited_by"),
      PropField("last_edited_time"),
      PropField("phone"),
      PropField("place"),
      PropField("rollup"),
      PropField("rollup_array"),
      PropField("rollup_array", "rollup_array_unmerged", {flag: "unmerge"}),
      // PropField("doesnt_exist", "fuck_you"),
    ], {validate: async () => true}),
    // Music: schema.entries("28f3ac579dc4809f95c2c1576a1dcfb7", [
    //   Field("id"),
    //   PropField("Name", "title"),
    //   PropField("desc", "desc"),
    //   PropField("desc", "description"),
    //   // PropField("doesnt_exist", "fuck_you"),
    // ], {validate: async () => true}),
    // Apps: schema.entries("28f3ac579dc4809f95c2c1576a1dcfb7", [
    //   Field("id"),
    //   PropField("Name", "title"),
    //   PropField("desc"),
    //   PropField("desc", "description"),
    //   // PropField("doesnt_exist", "fuck_you"),
    // ], {validate: async () => true}),
  })

  console.log(CONTENT)
}

setInterval(() => {}, 10)